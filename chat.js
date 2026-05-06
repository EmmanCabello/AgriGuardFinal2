import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabaseUrl = 'https://txjmluwbwvwzokcnelrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4am1sdXdid3Z3em9rY25lbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNjE0OTIsImV4cCI6MjA5MjgzNzQ5Mn0.rFaInFV0_fLLuiIm9uPdrvnGYZJ5FMYhE6KnNhKMYYU'
const chatRoomSection = document.getElementById('chat-rooms')
const chatMessagesSection = document.getElementById('chat-messages')
const productDetailsSection = document.getElementById('product-panel')
const chatInputSection = document.getElementById('chat-input')
const sendBtn = document.getElementById('send-btn')
const input = document.querySelector('#chat-input input');
const backBtn = document.getElementById('back-btn')


function showChatUI() {
    chatMessagesSection.classList.remove("hidden");
    productDetailsSection.classList.remove("hidden");
    chatInputSection.classList.remove("hidden");
}

function hideChatUI() {
    chatMessagesSection.classList.add("hidden");
    productDetailsSection.classList.add("hidden");
    chatInputSection.classList.add("hidden");
}

const supabase = createClient(supabaseUrl, supabaseKey)
let user
let selectedProductId
let selectedChatRoom
let sellerIdLastSeenTime
let buyerIdLastSeenTime
let otherUserLastSeenTime
let otherUserRawTime
let currentSellerId, currentBuyerId, messagesFoorSeen, currentItem, currentRoom
const item = JSON.parse(localStorage.getItem('selectedChat'));

console.log(item)



async function retrieveChatRooms() {
    const { data, error } = await supabase
        .from('chatrooms')
        .select(`
    *,
    marketplace:product_id (image, name, description, price),
    sender:lastmessagesenderid (name),
    seller:seller_id (name),
    buyer:buyer_id (name)
`)
        .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)

        .order('lastmessagetimesent', { ascending: false });

    if (error) {
        console.error(error);
        return null;
    }

    console.log(data);
    renderChatRooms(data);
}

function renderChatRooms(rooms) {
    chatRoomSection.innerHTML = '';

    rooms.forEach(room => {
        const item = room.marketplace || {};

        const rawDate = new Date(room.lastmessagetimesent);
        const formattedDate = rawDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        chatRoomSection.innerHTML += `
<div class="chat-room-content" 
data-id="${room.id}" 
data-productname="${item.name || ''}"
data-desc="${item.description || ''}" 
data-price="${item.price || ''}" 
data-sellerid="${room.seller_id}" 
data-sellername="${room.seller.name}"
data-buyerid="${room.buyer_id}"
data-buyername="${room.buyer.name}"
data-productimage="${item.image || ''}">

    <img class="chat-room-img" src="${item.image || ''}" />

    <div class="chat-room-data">
        <div class="chat-room-top">
            <p class="chat-room-name">
                ${item.name || 'No product'}
            </p>
            <span class="chat-room-time">
                ${formattedDate || ''}
            </span>
        </div>

        <p class="chat-room-message">
            ${room.sender.name || 'Unknown'}: 
            ${room.lastMessage || ''}
        </p>
    </div>
</div>
        `;
    });
}

async function checkUserSession() {
    const { data, error } = await supabase.auth.getSession();
    const session = data?.session;

    if (!session) {
        console.log("Session invalid → redirecting");
        window.location.href = "login.html";
    }
    user = session.user;
}
await checkUserSession()

const chatChannel = supabase.channel(`chat-rooms`);

chatChannel
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chatrooms',filter: `or(buyer_id.eq.${user.id},seller_id.eq.${user.id})` },
        async (payload) => {
            console.log('messages changed:', payload);
            await retrieveChatRooms()
        }
    )
    .subscribe((status) => {
        console.log('STATUS:', status);
    });


async function createOrOpenChatRoom(productId, sellerId) {
    const { data, error } = await supabase
        .from('chatrooms')
        .select(`id`)
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('transactionCompleted', false)

    if (error) {
        console.error(error);
        return
    }
    console.log(data)
    if (data === null || data.length === 0 || !data) {
        const buyerId = user.id
        console.log("INSERT VALUES:", {
            productId,
            buyerId,
            sellerId
        });
        await createChatRoom(productId, user.id, sellerId);
    }

}

async function createChatRoom(productId, buyerId, sellerId) {

    const { data, error } = await supabase
        .from('chatrooms')
        .insert([
            {
                seller_id: sellerId,
                buyer_id: buyerId,
                product_id: productId
            }
        ])

    if (error) {
        console.error(error);
        return
    }
    localStorage.removeItem('selectedChat')
}

async function retrieveMessages(chatRoomId) {
    const { data, error } = await supabase
        .from('messages')
        .select(`*`)
        .eq('chatroomid', chatRoomId)
        .order('timesent')
    if (error) {
        console.error(error);
        return null
    }
    showChatUI()

    return data
}

async function renderMessages(messages, item, room) {
    chatMessagesSection.innerHTML = ''
    productDetailsSection.innerHTML = ''
    if (room.sellerid === user.id) {
        productDetailsSection.innerHTML += `
        <div class="product-name" id="product-name">Your Product</div>
        `
    }
    productDetailsSection.innerHTML += `
        <img class="product-img" src="${item.img}" id="product-img" />
        <div class="product-name" id="product-name">${item.name}</div>
        <div class="product-desc" id="product-desc">
            <strong>Description: </strong>${item.desc}
        </div>
        <div class="product-price" id="product-price">
            <strong>Price: </strong>${item.price}
        </div>
`;
    messages.forEach((message, index) => {

        const rawDate = new Date(message.timesent);
        const formattedDate = rawDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        if (message.senderid !== user.id) {
            let displayName
            if (message.senderid === room.sellerid) {
                displayName = room.sellername
            } else {
                displayName = room.buyername
            }
            chatMessagesSection.innerHTML += `
            <p class="message-name">${displayName}</p>
                <div class="left-message-row">
            <div class="message-bubble" data-time="${message.timesent}">
                ${message.message}
                <span class="message-time">${formattedDate}</span>
            </div>
        </div>
        `
        } else {
            chatMessagesSection.innerHTML += `
                <div class="right-message-row">
            <div class="message-bubble" data-time="${message.timesent}">
                ${message.message}
                <span class="message-time">${formattedDate}</span>
            </div>
        </div>
        `

        }

        if (user.id === message.senderid) {
            if (
                otherUserLastSeenTime >= message.timesent &&
                otherUserLastSeenTime < messages[index + 1]?.timesent && index !== messages.length - 1
            ) {
                chatMessagesSection.innerHTML += `
        <p class="message-status">Seen</p>
    `;
            } else if (
                otherUserLastSeenTime >= message.timesent && index === messages.length - 1 && otherUserLastSeenTime !== null
            ) {
                chatMessagesSection.innerHTML += `
        <p class="message-status">Seen</p>
    `;
            } else if (
                otherUserLastSeenTime < message.timesent && index === messages.length - 1 || otherUserLastSeenTime === null
            ) {
                chatMessagesSection.innerHTML += `
        <p class="message-status">Sent</p>
    `;
            }
            console.log({
                index,
                total: messages.length,
                messageTime: message.timesent,
                lastSeen: otherUserLastSeenTime,
                condition1:
                    otherUserLastSeenTime >= message.timesent &&
                    otherUserLastSeenTime < messages[index + 1]?.timesent &&
                    index !== messages.length - 1,

                condition2:
                    otherUserLastSeenTime >= message.timesent &&
                    index === messages.length - 1,

                condition3:
                    (otherUserLastSeenTime < message.timesent &&
                        index === messages.length - 1) ||
                    otherUserLastSeenTime === null
            });
        }

    })

}

function setSelectedChat(roomId) {
    // remove old selection
    document.querySelectorAll('.chat-room-content').forEach(el => {
        el.classList.remove('selected');
    });

    // find matching element
    const el = document.querySelector(`.chat-room-content[data-id="${roomId}"]`);
    if (el) {
        el.classList.add('selected');

    }
}



async function selectSennList(userId, chatId) {
    const { data, error } = await supabase
        .from('seenlist')
        .select(`lastseentime`)
        .eq('userid', userId)
        .eq('chatroomid', chatId)

    if (error) {
        console.error(error);
        return
    }
    console.log(data)
    return data?.[0] ?? null;
}

async function updateSeenList(userId, chatId) {
    const { data, error } = await supabase
        .from('seenlist')
        .update({
            lastseentime: new Date().toISOString()
        })
        .eq('userid', userId)
        .eq('chatroomid', chatId)
        .select();

    if (error) {
        console.error('updateSeenList error:', error);
        return null;
    }
}
hideChatUI()




async function sendMessage(message, chatroomId, senderId) {

    if (input.value === "") {
        return
    }
    const { data, error } = await supabase
        .from('messages')
        .insert([
            {
                message: input.value,
                senderid: senderId,
                chatroomid: chatroomId
            }
        ]);

    if (error) {
        console.error(error);
        return
    }

    input.value = "";
}

await retrieveChatRooms()

chatRoomSection.addEventListener('click', async event => {
    const chatRoom = event.target.closest('.chat-room-content');

    // remove previous selection
    document.querySelectorAll('.chat-room-content').forEach(el => {
        el.classList.remove('selected');
    });

    // add to clicked one
    chatRoom.classList.add('selected');
    if (chatRoom) {
        const roomData = {
            id: chatRoom.dataset.id,
            sellerid: chatRoom.dataset.sellerid,
            sellername: chatRoom.dataset.sellername,
            buyername: chatRoom.dataset.buyername,
            buyerid: chatRoom.dataset.buyerid
        };
        const itemData = {
            name: chatRoom.dataset.productname,
            desc: chatRoom.dataset.desc,
            price: chatRoom.dataset.price,
            img: chatRoom.dataset.productimage
        };

        if (roomData !== null) {
            const messages = await retrieveMessages(roomData.id)

            if (roomData.buyerid === user.id) {
                sellerIdLastSeenTime = await selectSennList(roomData.sellerid, roomData.id)
                otherUserRawTime = sellerIdLastSeenTime
                otherUserLastSeenTime = otherUserRawTime.lastseentime
                console.log(otherUserLastSeenTime)
            } else {
                buyerIdLastSeenTime = await selectSennList(roomData.buyerid, roomData.id)
                otherUserRawTime = buyerIdLastSeenTime
                otherUserLastSeenTime = otherUserRawTime.lastseentime
            }
            currentSellerId = roomData.sellerid
            currentBuyerId = roomData.buyerid
            currentItem = itemData
            currentRoom = roomData
            messagesFoorSeen = messages
            selectedChatRoom = roomData.id
            subscribeToRoom(selectedChatRoom, itemData, roomData)
            console.log("current room id: ", selectedChatRoom)
            renderMessages(messages, itemData, roomData)
            await updateSeenList(user.id, roomData.id)
            console.log(messages)
        }
        console.log("item: ", itemData, "room: ", roomData)
    }
});

sendBtn.addEventListener('click', async event => {
    sendMessage(input.textContent, selectedChatRoom, user.id);
})

backBtn.addEventListener('click', () => {
    closeTab()
})

input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // prevents newline (just in case)
        sendMessage(input.textContent, selectedChatRoom, user.id);

    }
});

if (item) {
    await createOrOpenChatRoom(item.id, item.sellerId)
}

let dbChannel = null;

function subscribeToRoom(roomId, itemData, roomData) {
    // 1. cleanup old channel
    if (dbChannel) {
        supabase.removeChannel(dbChannel);
    }

    // 2. create new channel
    dbChannel = supabase.channel(`chat-updates-${roomId}`);

    dbChannel
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages', filter: `chatroomid=eq.${roomId}` },
            async (payload) => {
                console.log('messages changed:', payload);
                updateSeenList(user.id, roomData.id)
                const newMessages = await retrieveMessages(roomId)
                await renderMessages(newMessages, itemData, roomData)
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'chatrooms', filter: `id=eq.${roomId}` },
            async (payload) => {
                console.log('messages changed:', payload);
                await retrieveChatRooms()
            }
        )
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'seenlist', filter: `chatroomid=eq.${roomId}` },
            async (payload) => {
                console.log('seenlist changed:', payload);

                if (payload.new.userid !== user.id) {
                    otherUserRawTime = payload.new
                    otherUserLastSeenTime = otherUserRawTime.lastseentime
                }

                const newMessages = await retrieveMessages(roomId)
                await renderMessages(newMessages, itemData, roomData)
            }
        )
        .subscribe((status) => {
            console.log('STATUS:', status);
        });
}



function closeTab() {
    localStorage.removeItem('selectedChat')
    window.history.back();
}

