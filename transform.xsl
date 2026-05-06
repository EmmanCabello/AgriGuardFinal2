<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <html>
            <head>
                <title>AgriGuard Data</title>
            </head>
            <body>
                <h2>Weather Data</h2>
                <table border="1">
                    <tr>
                        <th>Date</th>
                        <th>Temperature</th>
                        <th>Humidity</th>
                        <th>Rainfall</th>
                    </tr>
                    <xsl:for-each select="agriData/weather">
                        <tr>
                            <td><xsl:value-of select="date"/></td>
                            <td><xsl:value-of select="temperature"/></td>
                            <td><xsl:value-of select="humidity"/></td>
                            <td><xsl:value-of select="rainfall"/></td>
                        </tr>
                    </xsl:for-each>
                </table>

                <h2>Crop Status</h2>
                <ul>
                    <xsl:for-each select="agriData/crop">
                        <li>
                            <strong><xsl:value-of select="name"/></strong>: 
                            <xsl:value-of select="status"/> - 
                            <xsl:value-of select="yield"/>
                        </li>
                    </xsl:for-each>
                </ul>

                <h2>Alerts</h2>
                <xsl:for-each select="agriData/alert">
                    <div style="color: red;">
                        <strong><xsl:value-of select="type"/></strong>: 
                        <xsl:value-of select="message"/> 
                        (<xsl:value-of select="date"/>)
                    </div>
                </xsl:for-each>

                <h2>Weather Sensors</h2>
                <table border="1">
                    <tr>
                        <th>Sensor ID</th>
                        <th>Location</th>
                        <th>Temperature</th>
                        <th>Humidity</th>
                        <th>Wind Speed</th>
                        <th>Last Update</th>
                    </tr>
                    <xsl:for-each select="agriData/weatherSensor">
                        <tr>
                            <td><xsl:value-of select="id"/></td>
                            <td><xsl:value-of select="location"/></td>
                            <td><xsl:value-of select="temperature"/></td>
                            <td><xsl:value-of select="humidity"/></td>
                            <td><xsl:value-of select="windSpeed"/></td>
                            <td><xsl:value-of select="lastUpdate"/></td>
                        </tr>
                    </xsl:for-each>
                </table>

                <h2>Pest Sensors</h2>
                <table border="1">
                    <tr>
                        <th>Sensor ID</th>
                        <th>Location</th>
                        <th>Pest Type</th>
                        <th>Detection Level</th>
                        <th>Status</th>
                        <th>Last Update</th>
                    </tr>
                    <xsl:for-each select="agriData/pestSensor">
                        <tr>
                            <td><xsl:value-of select="id"/></td>
                            <td><xsl:value-of select="location"/></td>
                            <td><xsl:value-of select="pestType"/></td>
                            <td><xsl:value-of select="detectionLevel"/></td>
                            <td><xsl:value-of select="status"/></td>
                            <td><xsl:value-of select="lastUpdate"/></td>
                        </tr>
                    </xsl:for-each>
                </table>

                <h2>Marketplace</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <xsl:for-each select="agriData/marketplaceItem">
                        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: #f9f9f9;">
                            <h4><xsl:value-of select="name"/></h4>
                            <p><xsl:value-of select="description"/></p>
                            <p style="font-weight: bold; color: #2e7d32;">₱<xsl:value-of select="price"/>/<xsl:value-of select="unit"/></p>
                            <p style="color: #666; font-size: 0.9em;">Seller: <xsl:value-of select="seller"/></p>
                        </div>
                    </xsl:for-each>
                </div>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>