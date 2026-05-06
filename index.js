import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://txjmluwbwvwzokcnelrl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4am1sdXdid3Z3em9rY25lbHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNjE0OTIsImV4cCI6MjA5MjgzNzQ5Mn0.rFaInFV0_fLLuiIm9uPdrvnGYZJ5FMYhE6KnNhKMYYU'

const supabase = createClient(supabaseUrl, supabaseKey)
const messages = document.getElementById('chats')
let latestWeatherUpdate;
let pestSensors;
const userMap = new Map()
let newImageFile;
let selectedPostId;

const searchBar = document.getElementById('market-search')

let session;
let currentUserEmail, currentUserId, currentUserType;
async function fetchPadreGarciaWeather() {
    const latitude = 14.1484;
    const longitude = 121.1888;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Asia/Manila`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API request failed');
    return response.json();
}

//Update weather table today
async function updateWeatherTable() {
    try {
        const data = await fetchPadreGarciaWeather();
        const currentTime = data.current_weather.time;
        const index = data.hourly.time.indexOf(currentTime);
        const humidity = data.hourly.relativehumidity_2m[index] + "%";

        console.log("weather data", data)

        // 1. Get the raw API time and chop off the time portion
        const rawApiDate = data.current_weather.time; // "2026-04-27T14:00"
        const apiDateOnly = rawApiDate.split('T')[0]; // "2026-04-27"

        const apiTemp = data.current_weather.temperature + "°C";
        const apiRainfall = data.daily.precipitation_sum[0] + "mm";
        console.log(latestWeatherUpdate + " " + apiDateOnly)


        if (apiDateOnly !== latestWeatherUpdate) {

            // --- INSERT DATA INTO SUPABASE ---
            const { error } = await supabase
                .from('weather')
                .insert([
                    {
                        date: apiDateOnly,
                        temperature: apiTemp,
                        humidity: humidity,
                        rainfall: apiRainfall
                    }
                ]);

            if (error) {
                console.error("Error inserting weather data:", error);
            } else {
                console.log("Weather data successfully saved to database!");
            }
        }
    } catch (err) {
        console.error("Failed to fetch or save weather:", err);
    }
}

//Load weather sensors
async function loadWeatherSensor() {
    const { data, error } = await supabase
        .from('weathersensor')
        .select('*')
        .order('lastupdate', { ascending: false })

    console.log('DATA:', data)
    console.log('ERROR:', error)
    if (error) return
    renderWeatherSensor(data)
}

function renderWeatherSensor(data) {
    const tbody = document.querySelector('#weatherSensors tbody')
    tbody.innerHTML = ''

    data.forEach(row => {
        const tr = document.createElement('tr')
        const rawDate = new Date(row.lastupdate);
        const formattedDate = rawDate.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        tr.innerHTML = `
          <td>${row.id}</td>
          <td>${row.location}</td>
          <td>${row.temperature}</td>
          <td>${row.humidity}</td>
          <td>${row.windspeed}</td>
          <td>${formattedDate}</td>
        `

        tbody.appendChild(tr)
    })
}

//Load Weather today
async function loadWeather() {
    const { data, error } = await supabase
        .from('weather')
        .select('*')
        .order('date', { ascending: false })

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error) return

    if (data.length > 0) {
        latestWeatherUpdate = data[0].date
    }
    renderWeatherTable(data)
}

function renderWeatherTable(data) {
    const tbody = document.querySelector('#weather tbody')
    tbody.innerHTML = ''

    data.forEach(row => {
        const tr = document.createElement('tr')

        tr.innerHTML = `
          <td>${row.date}</td>
          <td>${row.temperature}</td>
          <td>${row.humidity}</td>
          <td>${row.rainfall}</td>
        `

        tbody.appendChild(tr)
    })
}

//Pests
async function loadPestSensors() {
    const { data, error } = await supabase
        .from('pestsensor')
        .select('*')
        .order('lastupdate', { ascending: false })

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error) return

    renderPestSensorsTable(data)
    pestSensors = data

    console.log(pestSensors)
}
function renderPestSensorsTable(data) {
    // 1. Target the specific table by its unique ID
    const tbody = document.querySelector('#pestsensor tbody');

    // Clear out any existing rows
    tbody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        // 1. Convert the Supabase timestamp into a JavaScript Date object
        const rawDate = new Date(row.lastupdate);

        // 2. Format it to "April 12, 2026, 10:00 AM" using the local timezone
        const formattedDate = rawDate.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Sensor ID | Location | Pest Type | Detection Level | Status | Last Update
        tr.innerHTML = `
          <td>${row.id || 'N/A'}</td> 
          <td>${row.location}</td>
          <td>${row.pesttype}</td>
          <td>${row.detectionlevel}</td>
          <td>${row.status}</td>
          <td>${formattedDate}</td>
        `;

        tbody.appendChild(tr);
    });
}


//Crops status list
async function loadCropStatus() {
    const { data, error } = await supabase
        .from('crop')
        .select('*')

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error) return

    renderCropStatusList(data)
}
function renderCropStatusList(data) {

    const list = document.querySelector('#cropstatuslist');

    // Quick safety check to prevent crashes if the HTML is missing
    if (!list) {
        console.error("Could not find the list element in the HTML!");
        return;
    }

    // Clear out any existing rows
    list.innerHTML = '';

    data.forEach(row => {
        const li = document.createElement('li');

        // 2. Use innerHTML instead of textContent so the <strong> tags actually work!
        li.innerHTML = `<strong>${row.name}</strong> | ${row.status} | ${row.yield}`;

        list.appendChild(li);
    });
}

//Alerts check
async function updateAlerts() {
    const data = await fetchPadreGarciaWeather()
    const current = data.current_weather;
    const currentTime = current.time;
    const index = data.hourly.time.indexOf(currentTime);
    const humidity = data.hourly.relativehumidity_2m[index] + "%";
    const rainToday = data.daily.precipitation_sum[0];
    const alerts = [];
    const pestNote = 'Note: Inspect crops for pests and apply preventive measures if needed.';
    const alertInfo = document.getElementById("loadAlertInfo")
    if (current.temperature >= 33) {
        alerts.push({
            level: 'Immediate',
            type: 'immediate',
            title: 'High Temperature',
            message: `Current temperature is ${current.temperature.toFixed(1)}°C in Padre Garcia.`
        });
    }
    if (humidity >= 78 && rainToday > 0) {
        alerts.push({
            level: 'Warning',
            type: 'warning',
            title: 'Wet Crop Risk',
            message: `Humidity ${humidity}% with ${rainToday.toFixed(1)} mm rain may increase pest and fungus risk.`
        });
    }
    if (current.windspeed >= 25) {
        alerts.push({
            level: 'Warning',
            type: 'warning',
            title: 'Strong Winds',
            message: `Wind speed is ${current.windspeed.toFixed(1)} km/h.`
        });
    }
    pestSensors.forEach(sensor => {
        console.log(sensor.detectionlevel)
        if (sensor.detectionlevel === 'High' || sensor.status === 'Warning') {
            console.log(sensor.detectionlevel)
            alerts.push({
                level: 'Warning',
                type: 'warning',
                title: 'Pest Risk',
                message: `Sensor readings suggest elevated pest pressure in Padre Garcia. ${pestNote}`
            });
        }
    })

    if (alerts.length === 0) {
        alerts.push({
            level: 'Safe',
            type: 'safe',
            title: 'All Clear',
            message: 'No active alerts for Padre Garcia at the moment.'
        });
    }

    const list = document.querySelector('#alertlist');
    list.style.listStyleType = "none";

    // Quick safety check to prevent crashes if the HTML is missing
    if (!list) {
        console.error("Could not find the list element in the HTML!");
        return;
    }

    // Clear out any existing rows
    list.innerHTML = '';
    alertInfo.style.display = "none";
    alerts.forEach(alert => {
        const li = document.createElement('li');

        // 2. Use innerHTML instead of textContent so the <strong> tags actually work!
        li.innerHTML = `
                <div class="alert ${alert.type}">
                    <span class="alert-status alert-${alert.type}" aria-hidden="true"></span>
                    <strong>${alert.level}</strong>: ${alert.message}
                </div>
                `;

        list.appendChild(li);
    });

}

//Insert post
async function insertPost(event) {
    event.preventDefault();
    const sellForm = document.getElementById("sell-form")
    const name = document.getElementById("product-name").value;
    const description = document.getElementById("product-description").value;
    const price = document.getElementById("product-price").value;
    const quantity = document.getElementById("product-quantity").value;
    const location = document.getElementById("product-location").value;
    const imageFile = document.getElementById("product-image-input").files[0];
    let imageUrl;
    if (imageFile) {
        imageUrl = await uploadImage(imageFile);

    }

    const { error } = await supabase
        .from('marketplace')
        .insert([
            {
                name: name,
                description: description,
                price: price,
                unit: "kg",
                image: imageUrl,
                location: location,
                seller_id: session.user.id
            }
        ]);

    if (error) {
        console.error("Error inserting data:", error.message);
        alert("Failed to save product");
        return;
    } else {
        alert(`Product "${name}" listed successfully!\nDescription: ${description}`);
        clearForm('sell-form')
    }
}

document.querySelector(".sell-form")
    .addEventListener("submit", insertPost);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#edit-form")

    if (!form) {
        console.error("Edit form not found")
        return
    }

    form.addEventListener("submit", (event) => {
        editPost(event, selectedPostId)
    })
})

async function loadMarketPlace() {
    const { data, error } = await supabase
        .from('marketplace')
        .select('*')

    if (error) {
        console.error("Error:", error);
        return
    }
    for (const item of data) {
        const name = await selectUserName(item.seller_id)
        console.log(name)
    }


    console.log("market data:", data)
    renderMarketPlace(data)
}

async function searchMarketPlace(query) {
    const { data, error } = await supabase
        .from('marketplace')
        .select('*')
        .or(`name.ilike.${query}%,description.ilike.${query}%`)
        
        if (error) {
            console.error("Error:", error);
            return
        }
    for (const item of data) {
        const name = await selectUserName(item.seller_id)
        console.log(name)
    }


    console.log("market data:", data)
    renderMarketPlace(data)
}


async function selectUserName(id) {
    if (userMap.has(id)) {
        console.log("From cache:", userMap.get(id))
        return userMap.get(id)
    }

    const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', id)
        .single()

    if (error) {
        console.error("Error:", error)
        return
    }

    userMap.set(data.id, data.name)

    console.log("Fetched:", data.name)
    return data.name
}

function renderMarketPlace(data, sellerName) {
    setupMarketActions()
    const marketPlaceList = document.querySelector("#market_items");
    let productCard;

    marketPlaceList.innerHTML = '';

    data.forEach(item => {
        const sellerName = userMap.get(item.seller_id) || 'Unknown Seller'

        if (item.seller_id !== currentUserId) {

            productCard = `
        <div class="product-card">
            <img class="card-image" src="${item.image || 'placeholder.svg'}" alt="${item.name}">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p class="price">₱${item.price}</p>
            <p class="seller">${sellerName || ''}</p>
<button class="buyBtn" 
    data-id="${item.id}"
    data-name="${item.name}"
    data-sellerName="${sellerName || ''}"
    data-sellerId="${item.seller_id}"
    data-price="${item.price}"
    data-description="${item.description}"
    data-location="${item.location || ''}"
    data-quantity="${item.quantity || ''}"
    data-image="${item.image || ''}">
    Buy Now
</button>
        </div>
    `
        }

        else {
            productCard = `
        <div class="product-card">
            <img class="card-image" src="${item.image || 'placeholder.svg'}" alt="${item.name}">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <p class="price">₱${item.price}</p>
            <p class="seller">${sellerName}</p>
<button class="editBtn button-outline" 
    data-id="${item.id}"
    data-name="${item.name}"
    data-description="${item.description}"
    data-price="${item.price}"
    data-location="${item.location || ''}"
    data-sellername="${sellerName || ''}"
    data-sellerid="${item.seller_id}"
    data-quantity="${item.quantity || ''}"
    data-image="${item.image || ''}">
    Edit
</button>
            <button class="deleteBtn button-outline" data-id="${item.id}">
                Delete
            </button>
        </div>
    `
        }
        marketPlaceList.innerHTML += productCard;
    });
}

async function uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`

    const filePath = `products/${fileName}`

    const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
            upsert: false
        })

    if (error) {
        console.error("Upload error:", error.message)
        return null
    }

    const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

    return urlData.publicUrl
}

async function editPost(event, postId) {
    event.preventDefault()
    const editName = document.getElementById("edit-name").value
    const editDescription = document.getElementById("edit-description").value
    const editPrice = document.getElementById("edit-price").value
    const editLocation = document.getElementById("edit-location").value
    console.log(postId, editDescription, editName, editLocation, editPrice)

    let link = null

    if (newImageFile) {
        link = await uploadImage(newImageFile)
    }

    console.log("new image link", link)

    const { data, error } = await supabase
        .from('marketplace')
        .update({
            name: editName,
            location: editLocation,
            price: editPrice,
            description: editDescription,
            image: link ?? undefined
        })
        .eq('id', postId)
        .select()

    if (error) {
        console.error("Update error:", error)
        return
    }

    hideEditPanel()
    console.log("Updated successfully:", data)
}

const editImageInput = document.getElementById("edit-image-input")
const editImagePreview = document.getElementById("edit-image-preview")
const editCurrentImage = document.getElementById("edit-current-image")

editImageInput.addEventListener("change", (event) => {
    const file = event.target.files[0]
    newImageFile = file
    if (!file) {
        return
    }

    console.log("Selected file:", file)

    const imageUrl = URL.createObjectURL(file)

    editCurrentImage.src = imageUrl
    editImagePreview.style.display = "block"
})

function setupMarketActions() {
    const marketItems = document.getElementById('market_items');
    if (!marketItems || marketItems._actionsAttached) return;
    marketItems._actionsAttached = true;

    marketItems.addEventListener('click', async event => {
        const buyButton = event.target.closest('.buyBtn');
        if (buyButton) {
            const item = {
                id: buyButton.dataset.id,
                name: buyButton.dataset.name,
                sellerId: buyButton.dataset.sellerid,
                sellerName: buyButton.dataset.sellername,
                price: buyButton.dataset.price,
                description: buyButton.dataset.description,
                location: buyButton.dataset.location,
                image: buyButton.dataset.image
            };
            console.log('Edit button clicked for product', item);
            await openChat(item);
            return;
        }

        const editButton = event.target.closest('.editBtn');
        if (editButton) {
            const product = {
                id: editButton.dataset.id,
                name: editButton.dataset.name,
                description: editButton.dataset.description,
                price: editButton.dataset.price,
                location: editButton.dataset.location,
                sellerId: editButton.dataset.sellerid,
                image: editButton.dataset.image
            };
            console.log('Edit button clicked for product', product);
            openEditPanel(product);
            return;
        }

        const deleteButton = event.target.closest('.deleteBtn');
        if (deleteButton) {
            const productId = deleteButton.dataset.id;
            console.log('Delete button clicked for productId', productId);
            if (confirm('Delete this listing?')) {
                await deleteProduct(productId);
            }
        }
    });
}


async function openEditPanel(product) {
    document.getElementById('edit-name').value = product.name || '';
    document.getElementById('edit-description').value = product.description || '';
    document.getElementById('edit-price').value = product.price || '';
    document.getElementById('edit-location').value = product.location || '';
    const imagePreview = document.getElementById('edit-image-preview');
    const currentImage = document.getElementById('edit-current-image');
    if (product.image) {
        currentImage.src = product.image;
        imagePreview.style.display = 'block';
    } else {
        imagePreview.style.display = 'none';
    }
    document.getElementById('edit-image-input').value = '';
    document.getElementById('edit-panel').dataset.productId = product.id;
    selectedPostId = product.id
    document.getElementById('edit-panel').classList.remove('hidden');
}

async function hideEditPanel() {
    document.getElementById('edit-panel').classList.add('hidden');
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
}

async function checkUserSession() {
    const { data, error } = await supabase.auth.getSession();
    session = data?.session;

    if (!session) {
        console.log("Session invalid → redirecting");
        window.location.href = "login.html";
    }
    const user = session.user;
    console.log("email:", user.email, user.id);
    checkIfUserExistInDB(user.id)
    currentUserEmail = user.email;
    currentUserId = user.id;
    currentUserType = user.user_metadata?.type || 'buyer';


    const sellform = document.getElementById('sell-form')
    const header = document.getElementById('headers-actions')

    header.innerHTML = `
      <p>${currentUserEmail} | ${currentUserType}</p>
    <a class="button button-primary" id="log-out">Log Out</a>
    `
    if (sellform) {
        sellform.style.display =
            currentUserType === 'buyer' ? 'none' : 'block'
    } else {
        console.warn("sell-form not found in DOM")
    }

    console.log("Session valid → redirecting");
}

async function checkIfUserExistInDB(id) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // better than single()

    if (error) {
        console.error(error);
        return;
    }

    if (!data) {
        await supabase.auth.signOut();
        window.location.href = "login.html";
    }
}

async function logOut() {
    const confirmLogout = confirm("Are you sure you want to log out?");

    if (!confirmLogout) return;

    await supabase.auth.signOut();
    window.location.href = "login.html";
}

async function openChat(item) {
    localStorage.setItem('selectedChat', JSON.stringify(item));
    window.location.href = 'chats.html';
}

// 1. Create a single channel for your database changes
const dbChannel = supabase.channel('my-farm-updates');

dbChannel
    // 2. Listen for changes on the 'weather' table
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weather' },
        (payload) => {
            console.log('Weather table changed:', payload);
            // Re-fetch the data to update the UI
            loadWeather();
        }
    )
    // 3. Chain another listener for the 'pestsensor' table
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pestsensor' },
        (payload) => {
            console.log('Pest sensor table changed:', payload);
            loadPestSensors();
        }
    )

    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crop' },
        (payload) => {
            console.log('crop table changed:', payload);
            // Re-fetch the data to update the UI
            loadCropStatus();
        }
    )

    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace' },
        (payload) => {
            console.log('market table changed:', payload);
            // Re-fetch the data to update the UI
            loadMarketPlace();
        }
    )

    // 4. Finally, subscribe to start listening!
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log('Successfully connected to real-time updates!');
        }
    });
await checkUserSession()
await loadWeather()
await loadPestSensors()
await loadCropStatus()
await updateWeatherTable()
await updateAlerts()
await loadMarketPlace()
await loadWeatherSensor()
const logOutBtn = document.getElementById('log-out')


logOutBtn.addEventListener('click', logOut);

messages.addEventListener('click', () => {
    window.location.href = "chats.html";
})

searchBar.addEventListener('input', (event) => {
    console.log(event.target.value); // current text

    searchMarketPlace(event.target.value)

    if (event.target.value === "") {
        loadMarketPlace()
    }
});
