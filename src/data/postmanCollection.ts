export const aperturePostmanCollection = {
  "info": {
    "_postman_id": "8fa21e90-71a4-4cd1-9c95-4912676a5624",
    "name": "Aperture Asset Tracking API",
    "description": "Production Postman collection and Mock Server configuration for the Aperture RFID & IoT Asset Tracking System API. Every endpoint is fully documented with schema assertions, Tests scripts, and saved example responses matching live and mock payloads.",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "{{current_domain}}",
      "type": "string",
      "description": "Publicly accessible Live Base URL of the Aperture Asset Tracking API"
    },
    {
      "key": "url",
      "value": "{{current_domain}}",
      "type": "string",
      "description": "Base URL of the Aperture Asset Tracking API"
    }
  ],
  "item": [
    {
      "name": "Live Tags (RFID)",
      "description": "Real-time RFID tag stream ingestion, polling, and inventory endpoints compatible with GAO RFID and LLRP readers.",
      "item": [
        {
          "name": "Get Tags In Real Time",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response matches expected GAO RFID shape\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"status\", 200);",
                  "    pm.expect(jsonData).to.have.property(\"message\", \"Success\");",
                  "    pm.expect(jsonData).to.have.property(\"protocol\", \"GAO-RFID-HTTP-JSON\");",
                  "    pm.expect(jsonData).to.have.property(\"authenticated\");",
                  "    pm.expect(jsonData).to.have.property(\"timestamp\");",
                  "    pm.expect(jsonData).to.have.property(\"tagCount\");",
                  "    pm.expect(jsonData).to.have.property(\"tags\");",
                  "    pm.expect(Array.isArray(jsonData.tags)).to.be.true;",
                  "    if (jsonData.tags.length > 0) {",
                  "        var tag = jsonData.tags[0];",
                  "        pm.expect(tag).to.have.property(\"epc\");",
                  "        pm.expect(tag).to.have.property(\"assetId\");",
                  "        pm.expect(tag).to.have.property(\"name\");",
                  "        pm.expect(tag).to.have.property(\"category\");",
                  "        pm.expect(tag).to.have.property(\"status\");",
                  "        pm.expect(tag).to.have.property(\"zone\");",
                  "        pm.expect(tag).to.have.property(\"lastSeen\");",
                  "        pm.expect(tag).to.have.property(\"rssi\");",
                  "        pm.expect(tag).to.have.property(\"site\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/gao/getTagsInRealTime",
              "host": ["{{url}}"],
              "path": ["api", "gao", "getTagsInRealTime"]
            },
            "description": "Polls real-time GAO RFID tags in transit with epc, assetId, name, category, status, zone, lastSeen, rssi, and site."
          },
          "response": [
            {
              "name": "Successful Real-Time Tags Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/gao/getTagsInRealTime",
                  "host": ["{{url}}"],
                  "path": ["api", "gao", "getTagsInRealTime"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"status\": 200,\n  \"message\": \"Success\",\n  \"protocol\": \"GAO-RFID-HTTP-JSON\",\n  \"authenticated\": true,\n  \"timestamp\": \"{{$isoTimestamp}}\",\n  \"tagCount\": 3,\n  \"tags\": [\n    {\n      \"epc\": \"E2801191A000001000000456\",\n      \"assetId\": \"ast-1001\",\n      \"name\": \"DeWalt Impact Driver\",\n      \"category\": \"Power Tools\",\n      \"status\": \"In Zone\",\n      \"zone\": \"Laydown Yard A\",\n      \"lastSeen\": \"{{$isoTimestamp}}\",\n      \"rssi\": -50,\n      \"site\": \"Downtown Metro Tower\"\n    }\n  ]\n}"
            }
          ]
        },
        {
          "name": "Get RFID Tag Inventory",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response matches GAO-RFID-COMPATIBLE shape\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"protocol\", \"GAO-RFID-COMPATIBLE\");",
                  "    pm.expect(jsonData).to.have.property(\"totalTagsCount\");",
                  "    pm.expect(jsonData).to.have.property(\"tags\");",
                  "    pm.expect(Array.isArray(jsonData.tags)).to.be.true;",
                  "    if (jsonData.tags.length > 0) {",
                  "        var tag = jsonData.tags[0];",
                  "        pm.expect(tag).to.have.property(\"tagEpc\");",
                  "        pm.expect(tag).to.have.property(\"assetId\");",
                  "        pm.expect(tag).to.have.property(\"assetName\");",
                  "        pm.expect(tag).to.have.property(\"category\");",
                  "        pm.expect(tag).to.have.property(\"status\");",
                  "        pm.expect(tag).to.have.property(\"lastSeenAt\");",
                  "        pm.expect(tag).to.have.property(\"zoneName\");",
                  "        pm.expect(tag).to.have.property(\"rssi\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/v1/rfid/tags",
              "host": ["{{url}}"],
              "path": ["api", "v1", "rfid", "tags"]
            },
            "description": "Returns GAO RFID compatible list of registered tags using tagEpc and assetName keys."
          },
          "response": [
            {
              "name": "Successful Tag Inventory Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/v1/rfid/tags",
                  "host": ["{{url}}"],
                  "path": ["api", "v1", "rfid", "tags"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"protocol\": \"GAO-RFID-COMPATIBLE\",\n  \"totalTagsCount\": 3,\n  \"tags\": [\n    {\n      \"tagEpc\": \"E2801191A000001000000456\",\n      \"assetId\": \"ast-1001\",\n      \"assetName\": \"DeWalt Impact Driver\",\n      \"category\": \"Power Tools\",\n      \"status\": \"In Zone\",\n      \"lastSeenAt\": \"{{$isoTimestamp}}\",\n      \"zoneName\": \"Laydown Yard A\",\n      \"rssi\": -50\n    }\n  ]\n}"
            }
          ]
        },
        {
          "name": "Ingest RFID Tag Read",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response matches GAO-RFID-LLRP-v2 ingestion shape\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"status\", \"INGESTED\");",
                  "    pm.expect(jsonData).to.have.property(\"protocol\", \"GAO-RFID-LLRP-v2\");",
                  "    pm.expect(jsonData).to.have.property(\"event\");",
                  "    var evt = jsonData.event;",
                  "    pm.expect(evt).to.have.property(\"id\");",
                  "    pm.expect(evt).to.have.property(\"epc\");",
                  "    pm.expect(evt).to.have.property(\"assetId\");",
                  "    pm.expect(evt).to.have.property(\"assetName\");",
                  "    pm.expect(evt).to.have.property(\"readerId\");",
                  "    pm.expect(evt).to.have.property(\"readerName\");",
                  "    pm.expect(evt).to.have.property(\"siteId\");",
                  "    pm.expect(evt).to.have.property(\"siteName\");",
                  "    pm.expect(evt).to.have.property(\"zoneId\");",
                  "    pm.expect(evt).to.have.property(\"zoneName\");",
                  "    pm.expect(evt).to.have.property(\"rssi\");",
                  "    pm.expect(evt).to.have.property(\"timestamp\");",
                  "    pm.expect(evt).to.have.property(\"eventType\", \"SCAN\");",
                  "    pm.expect(evt).to.have.property(\"antennaId\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"epc\": \"E2801191A000001000000456\",\n  \"readerId\": \"reader-101\",\n  \"ant\": 1,\n  \"rssi\": -48\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/gao/read-tags",
              "host": ["{{url}}"],
              "path": ["api", "gao", "read-tags"]
            },
            "description": "Ingests inbound RFID tag pulse event from portal or handheld gateway reader."
          },
          "response": [
            {
              "name": "Successful Tag Read Ingestion Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"epc\": \"E2801191A000001000000456\",\n  \"readerId\": \"reader-101\",\n  \"ant\": 1,\n  \"rssi\": -48\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/gao/read-tags",
                  "host": ["{{url}}"],
                  "path": ["api", "gao", "read-tags"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"status\": \"INGESTED\",\n  \"protocol\": \"GAO-RFID-LLRP-v2\",\n  \"event\": {\n    \"id\": \"evt-gao-example\",\n    \"epc\": \"E2801191A000001000000456\",\n    \"assetId\": \"ast-1001\",\n    \"assetName\": \"DeWalt Impact Driver\",\n    \"readerId\": \"reader-101\",\n    \"readerName\": \"Gate Portal Reader\",\n    \"siteId\": \"site-01\",\n    \"siteName\": \"Downtown Metro Tower\",\n    \"zoneId\": \"z-01\",\n    \"zoneName\": \"Laydown Yard A\",\n    \"rssi\": -48,\n    \"timestamp\": \"{{$isoTimestamp}}\",\n    \"eventType\": \"SCAN\",\n    \"antennaId\": 1\n  }\n}"
            }
          ]
        }
      ]
    },
    {
      "name": "Assets",
      "description": "Full CRUD operations for enterprise tool, equipment, and machinery inventory with UHF RFID tag bindings.",
      "item": [
        {
          "name": "Get All Assets",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response is an array of asset records\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(Array.isArray(jsonData)).to.be.true;",
                  "    if (jsonData.length > 0) {",
                  "        var asset = jsonData[0];",
                  "        pm.expect(asset).to.have.property(\"id\");",
                  "        pm.expect(asset).to.have.property(\"name\");",
                  "        pm.expect(asset).to.have.property(\"category\");",
                  "        pm.expect(asset).to.have.property(\"status\");",
                  "        pm.expect(asset).to.have.property(\"siteId\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/assets",
              "host": ["{{url}}"],
              "path": ["api", "assets"]
            },
            "description": "Retrieves the complete fleet asset inventory."
          },
          "response": [
            {
              "name": "List Assets Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/assets",
                  "host": ["{{url}}"],
                  "path": ["api", "assets"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "[\n  {\n    \"id\": \"ast-1001\",\n    \"name\": \"DeWalt 20V MAX Impact Driver\",\n    \"category\": \"Power Tools\",\n    \"subCategory\": \"Fastening Tools\",\n    \"manufacturer\": \"DeWalt\",\n    \"model\": \"DCF887B\",\n    \"serialNumber\": \"SN-DW-49210\",\n    \"tagEpc\": \"E2801191A000001000000456\",\n    \"qrCode\": \"QR-9041\",\n    \"status\": \"In Zone\",\n    \"siteId\": \"site-01\",\n    \"siteName\": \"Downtown Metro Tower\",\n    \"zoneId\": \"z-01\",\n    \"zoneName\": \"Laydown Yard A\",\n    \"purchaseDate\": \"2024-03-15\",\n    \"cost\": 199,\n    \"condition\": \"Good\",\n    \"lastSeenAt\": \"{{$isoTimestamp}}\",\n    \"lastReaderId\": \"reader-101\",\n    \"rssi\": -50\n  },\n  {\n    \"id\": \"ast-1002\",\n    \"name\": \"Caterpillar 320D Hydraulic Excavator\",\n    \"category\": \"Heavy Equipment\",\n    \"subCategory\": \"Excavation\",\n    \"manufacturer\": \"CAT\",\n    \"model\": \"320D L\",\n    \"serialNumber\": \"CAT320D-99412\",\n    \"tagEpc\": \"E2801191A000001000000457\",\n    \"qrCode\": \"QR-3011\",\n    \"status\": \"In Zone\",\n    \"siteId\": \"site-01\",\n    \"siteName\": \"Downtown Metro Tower\",\n    \"zoneId\": \"z-02\",\n    \"zoneName\": \"East Loading Dock\",\n    \"purchaseDate\": \"2023-08-10\",\n    \"cost\": 185000,\n    \"condition\": \"Excellent\",\n    \"lastSeenAt\": \"{{$isoTimestamp}}\",\n    \"lastReaderId\": \"reader-102\",\n    \"rssi\": -44\n  }\n]"
            }
          ]
        },
        {
          "name": "Create Asset",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201 Created\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "pm.test(\"Asset record created with assigned ID and tag\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"name\");",
                  "    pm.expect(jsonData).to.have.property(\"category\");",
                  "    pm.expect(jsonData).to.have.property(\"siteId\");",
                  "    pm.expect(jsonData).to.have.property(\"cost\");",
                  "    pm.expect(jsonData).to.have.property(\"tagEpc\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Milwaukee M18 Fuel Hammer Drill\",\n  \"category\": \"Power Tools\",\n  \"siteId\": \"site-01\",\n  \"cost\": 299\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/assets",
              "host": ["{{url}}"],
              "path": ["api", "assets"]
            },
            "description": "Registers a new asset in the system registry."
          },
          "response": [
            {
              "name": "Create Asset Example Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Milwaukee M18 Fuel Hammer Drill\",\n  \"category\": \"Power Tools\",\n  \"siteId\": \"site-01\",\n  \"cost\": 299\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/assets",
                  "host": ["{{url}}"],
                  "path": ["api", "assets"]
                }
              },
              "status": "Created",
              "code": 201,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"ast-1003\",\n  \"name\": \"Milwaukee M18 Fuel Hammer Drill\",\n  \"category\": \"Power Tools\",\n  \"subCategory\": \"General\",\n  \"manufacturer\": \"Generic\",\n  \"model\": \"Standard\",\n  \"serialNumber\": \"SN-849102\",\n  \"tagEpc\": \"E2801191A000001000000789\",\n  \"qrCode\": \"QR-4912\",\n  \"status\": \"In Zone\",\n  \"siteId\": \"site-01\",\n  \"siteName\": \"Downtown Metro Tower\",\n  \"zoneId\": \"z-01\",\n  \"zoneName\": \"Laydown Yard A\",\n  \"purchaseDate\": \"2026-08-17\",\n  \"cost\": 299,\n  \"isRental\": false,\n  \"rentalCostPerDay\": 0,\n  \"condition\": \"Excellent\",\n  \"lastSeenAt\": \"{{$isoTimestamp}}\",\n  \"lastReaderId\": \"reader-101\",\n  \"rssi\": -50\n}"
            }
          ]
        },
        {
          "name": "Update Asset",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200 OK\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Updated asset fields match payload\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"status\", \"In Zone\");",
                  "    pm.expect(jsonData).to.have.property(\"condition\", \"Good\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"In Zone\",\n  \"condition\": \"Good\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/assets/:id",
              "host": ["{{url}}"],
              "path": ["api", "assets", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "ast-1001",
                  "description": "Asset Unique Identifier"
                }
              ]
            },
            "description": "Updates asset status, condition, or spatiotemporal metadata."
          },
          "response": [
            {
              "name": "Update Asset Example Response",
              "originalRequest": {
                "method": "PUT",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"status\": \"In Zone\",\n  \"condition\": \"Good\"\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/assets/:id",
                  "host": ["{{url}}"],
                  "path": ["api", "assets", ":id"],
                  "variable": [
                    {
                      "key": "id",
                      "value": "ast-1001"
                    }
                  ]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"ast-1001\",\n  \"name\": \"DeWalt 20V MAX Impact Driver\",\n  \"category\": \"Power Tools\",\n  \"status\": \"In Zone\",\n  \"condition\": \"Good\",\n  \"siteId\": \"site-01\",\n  \"siteName\": \"Downtown Metro Tower\",\n  \"zoneId\": \"z-01\",\n  \"zoneName\": \"Laydown Yard A\",\n  \"cost\": 199,\n  \"tagEpc\": \"E2801191A000001000000456\",\n  \"lastSeenAt\": \"{{$isoTimestamp}}\"\n}"
            }
          ]
        },
        {
          "name": "Delete Asset",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200 OK\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response confirms asset removal\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"message\");",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/assets/:id",
              "host": ["{{url}}"],
              "path": ["api", "assets", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "ast-1001",
                  "description": "Asset Unique Identifier"
                }
              ]
            },
            "description": "Removes an asset from the system registry."
          },
          "response": [
            {
              "name": "Delete Asset Example Response",
              "originalRequest": {
                "method": "DELETE",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/assets/:id",
                  "host": ["{{url}}"],
                  "path": ["api", "assets", ":id"],
                  "variable": [
                    {
                      "key": "id",
                      "value": "ast-1001"
                    }
                  ]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"message\": \"Asset removed successfully\",\n  \"id\": \"ast-1001\"\n}"
            }
          ]
        }
      ]
    },
    {
      "name": "Checkouts",
      "description": "Custody tracking, tool sign-outs, operator badge bindings, and return condition inspections.",
      "item": [
        {
          "name": "Get All Checkouts",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response is an array of custody checkouts\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(Array.isArray(jsonData)).to.be.true;",
                  "    if (jsonData.length > 0) {",
                  "        var chk = jsonData[0];",
                  "        pm.expect(chk).to.have.property(\"id\");",
                  "        pm.expect(chk).to.have.property(\"assetId\");",
                  "        pm.expect(chk).to.have.property(\"userId\");",
                  "        pm.expect(chk).to.have.property(\"status\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/checkouts",
              "host": ["{{url}}"],
              "path": ["api", "checkouts"]
            },
            "description": "Lists all active and historic tool custody checkouts."
          },
          "response": [
            {
              "name": "List Checkouts Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/checkouts",
                  "host": ["{{url}}"],
                  "path": ["api", "checkouts"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "[\n  {\n    \"id\": \"chk-8901\",\n    \"assetId\": \"ast-1001\",\n    \"assetName\": \"DeWalt Impact Driver\",\n    \"assetCategory\": \"Power Tools\",\n    \"tagEpc\": \"E2801191A000001000000456\",\n    \"userId\": \"usr-3\",\n    \"userName\": \"Carlos Mendez\",\n    \"badgeId\": \"BDG-1029\",\n    \"checkoutTime\": \"{{$isoTimestamp}}\",\n    \"expectedReturn\": \"{{$isoTimestamp}}\",\n    \"jobId\": \"job-downtown-01\",\n    \"jobName\": \"Downtown Tower Structural Framing\",\n    \"checkoutCondition\": \"Good\",\n    \"notes\": \"Issued for 4th floor structural framing\",\n    \"status\": \"ACTIVE\"\n  }\n]"
            }
          ]
        },
        {
          "name": "Create Checkout",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201 Created\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "pm.test(\"Checkout issued with active custody status\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"assetId\");",
                  "    pm.expect(jsonData).to.have.property(\"userId\");",
                  "    pm.expect(jsonData).to.have.property(\"status\", \"ACTIVE\");",
                  "    pm.expect(jsonData).to.have.property(\"expectedReturn\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"assetId\": \"ast-1001\",\n  \"userId\": \"usr-3\",\n  \"jobId\": \"job-downtown-01\",\n  \"expectedReturnHours\": 8\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/checkouts",
              "host": ["{{url}}"],
              "path": ["api", "checkouts"]
            },
            "description": "Signs out an asset to a field operator or job assignment."
          },
          "response": [
            {
              "name": "Create Checkout Example Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"assetId\": \"ast-1001\",\n  \"userId\": \"usr-3\",\n  \"jobId\": \"job-downtown-01\",\n  \"expectedReturnHours\": 8\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/checkouts",
                  "host": ["{{url}}"],
                  "path": ["api", "checkouts"]
                }
              },
              "status": "Created",
              "code": 201,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"chk-8902\",\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"assetCategory\": \"Power Tools\",\n  \"tagEpc\": \"E2801191A000001000000456\",\n  \"userId\": \"usr-3\",\n  \"userName\": \"Carlos Mendez\",\n  \"badgeId\": \"BDG-1029\",\n  \"checkoutTime\": \"{{$isoTimestamp}}\",\n  \"expectedReturn\": \"{{$isoTimestamp}}\",\n  \"jobId\": \"job-downtown-01\",\n  \"jobName\": \"Job #job-downtown-01\",\n  \"checkoutCondition\": \"Good\",\n  \"notes\": \"Handheld scanner checkout\",\n  \"status\": \"ACTIVE\"\n}"
            }
          ]
        },
        {
          "name": "Return Checkout",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200 OK\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Checkout status marked as RETURNED\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"status\", \"RETURNED\");",
                  "    pm.expect(jsonData).to.have.property(\"actualReturn\");",
                  "    pm.expect(jsonData).to.have.property(\"returnCondition\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"condition\": \"Good\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/checkouts/:id/return",
              "host": ["{{url}}"],
              "path": ["api", "checkouts", ":id", "return"],
              "variable": [
                {
                  "key": "id",
                  "value": "chk-8901",
                  "description": "Checkout Unique Identifier"
                }
              ]
            },
            "description": "Processes return of checked-out equipment back into zone storage."
          },
          "response": [
            {
              "name": "Return Checkout Example Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"condition\": \"Good\"\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/checkouts/:id/return",
                  "host": ["{{url}}"],
                  "path": ["api", "checkouts", ":id", "return"],
                  "variable": [
                    {
                      "key": "id",
                      "value": "chk-8901"
                    }
                  ]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"chk-8901\",\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"userId\": \"usr-3\",\n  \"userName\": \"Carlos Mendez\",\n  \"checkoutTime\": \"{{$isoTimestamp}}\",\n  \"actualReturn\": \"{{$isoTimestamp}}\",\n  \"returnCondition\": \"Good\",\n  \"status\": \"RETURNED\"\n}"
            }
          ]
        }
      ]
    },
    {
      "name": "Alerts",
      "description": "Security alarms, perimeter breach events, curfew violations, and supervisor resolutions.",
      "item": [
        {
          "name": "Get All Alerts",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response is an array of system alerts\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(Array.isArray(jsonData)).to.be.true;",
                  "    if (jsonData.length > 0) {",
                  "        var alert = jsonData[0];",
                  "        pm.expect(alert).to.have.property(\"id\");",
                  "        pm.expect(alert).to.have.property(\"type\");",
                  "        pm.expect(alert).to.have.property(\"severity\");",
                  "        pm.expect(alert).to.have.property(\"resolved\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/alerts",
              "host": ["{{url}}"],
              "path": ["api", "alerts"]
            },
            "description": "Fetches all active and resolved perimeter/geofence alerts."
          },
          "response": [
            {
              "name": "List Alerts Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/alerts",
                  "host": ["{{url}}"],
                  "path": ["api", "alerts"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "[\n  {\n    \"id\": \"alt-4401\",\n    \"type\": \"PERIMETER_BREACH\",\n    \"severity\": \"CRITICAL\",\n    \"assetId\": \"ast-1001\",\n    \"assetName\": \"DeWalt Impact Driver\",\n    \"siteId\": \"site-01\",\n    \"siteName\": \"Downtown Metro Tower\",\n    \"zoneId\": \"z-01\",\n    \"zoneName\": \"Laydown Yard A\",\n    \"triggeredAt\": \"{{$isoTimestamp}}\",\n    \"resolved\": false,\n    \"message\": \"Asset E2801191A000001000000456 detected outside authorized geofence radius\"\n  }\n]"
            }
          ]
        },
        {
          "name": "Create Alert",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201 Created\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "pm.test(\"Alert successfully registered in security engine\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"type\");",
                  "    pm.expect(jsonData).to.have.property(\"severity\");",
                  "    pm.expect(jsonData).to.have.property(\"resolved\", false);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"type\": \"PERIMETER_BREACH\",\n  \"severity\": \"CRITICAL\",\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"message\": \"Manual perimeter alert trigger\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/alerts",
              "host": ["{{url}}"],
              "path": ["api", "alerts"]
            },
            "description": "Publishes a new security or maintenance alert."
          },
          "response": [
            {
              "name": "Create Alert Example Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"type\": \"PERIMETER_BREACH\",\n  \"severity\": \"CRITICAL\",\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"message\": \"Manual perimeter alert trigger\"\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/alerts",
                  "host": ["{{url}}"],
                  "path": ["api", "alerts"]
                }
              },
              "status": "Created",
              "code": 201,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"alt-4402\",\n  \"type\": \"PERIMETER_BREACH\",\n  \"severity\": \"CRITICAL\",\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"siteId\": \"site-01\",\n  \"siteName\": \"Downtown Metro Tower\",\n  \"zoneId\": \"z-01\",\n  \"zoneName\": \"Gate Portal\",\n  \"triggeredAt\": \"{{$isoTimestamp}}\",\n  \"resolved\": false,\n  \"message\": \"Manual perimeter alert trigger\"\n}"
            }
          ]
        },
        {
          "name": "Resolve Alert",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200 OK\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Alert marked resolved with auditor credentials\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"resolved\", true);",
                  "    pm.expect(jsonData).to.have.property(\"resolvedAt\");",
                  "    pm.expect(jsonData).to.have.property(\"resolvedBy\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"resolvedBy\": \"Site Manager Sarah\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/alerts/:id/resolve",
              "host": ["{{url}}"],
              "path": ["api", "alerts", ":id", "resolve"],
              "variable": [
                {
                  "key": "id",
                  "value": "alt-4401",
                  "description": "Alert Unique Identifier"
                }
              ]
            },
            "description": "Marks an alert as investigated and resolved."
          },
          "response": [
            {
              "name": "Resolve Alert Example Response",
              "originalRequest": {
                "method": "PATCH",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"resolvedBy\": \"Site Manager Sarah\"\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/alerts/:id/resolve",
                  "host": ["{{url}}"],
                  "path": ["api", "alerts", ":id", "resolve"],
                  "variable": [
                    {
                      "key": "id",
                      "value": "alt-4401"
                    }
                  ]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"alt-4401\",\n  \"type\": \"PERIMETER_BREACH\",\n  \"severity\": \"CRITICAL\",\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"siteId\": \"site-01\",\n  \"siteName\": \"Downtown Metro Tower\",\n  \"zoneId\": \"z-01\",\n  \"zoneName\": \"Laydown Yard A\",\n  \"triggeredAt\": \"{{$isoTimestamp}}\",\n  \"resolved\": true,\n  \"resolvedAt\": \"{{$isoTimestamp}}\",\n  \"resolvedBy\": \"Site Manager Sarah\",\n  \"message\": \"Asset E2801191A000001000000456 detected outside authorized geofence radius\"\n}"
            }
          ]
        }
      ]
    },
    {
      "name": "Maintenance & Inventory",
      "description": "Equipment servicing work orders, consumable RFID tag supplies, and stock quantity updates.",
      "item": [
        {
          "name": "Get Maintenance Logs",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response is an array of maintenance work orders\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(Array.isArray(jsonData)).to.be.true;",
                  "    if (jsonData.length > 0) {",
                  "        var m = jsonData[0];",
                  "        pm.expect(m).to.have.property(\"id\");",
                  "        pm.expect(m).to.have.property(\"assetId\");",
                  "        pm.expect(m).to.have.property(\"type\");",
                  "        pm.expect(m).to.have.property(\"cost\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/maintenance",
              "host": ["{{url}}"],
              "path": ["api", "maintenance"]
            },
            "description": "Lists scheduled and historical equipment maintenance logs."
          },
          "response": [
            {
              "name": "List Maintenance Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/maintenance",
                  "host": ["{{url}}"],
                  "path": ["api", "maintenance"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "[\n  {\n    \"id\": \"maint-7001\",\n    \"assetId\": \"ast-1001\",\n    \"assetName\": \"DeWalt Impact Driver\",\n    \"type\": \"Preventive\",\n    \"date\": \"2026-08-17\",\n    \"scheduledDate\": \"2026-08-17\",\n    \"cost\": 150,\n    \"technician\": \"Elena Rostova\",\n    \"status\": \"Scheduled\",\n    \"notes\": \"100-hour rotor bushing & carbon brush inspection\",\n    \"workOrderId\": \"WO-8812\"\n  }\n]"
            }
          ]
        },
        {
          "name": "Create Maintenance Log",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201 Created\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "pm.test(\"Maintenance record registered with work order ID\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"assetId\");",
                  "    pm.expect(jsonData).to.have.property(\"assetName\");",
                  "    pm.expect(jsonData).to.have.property(\"type\");",
                  "    pm.expect(jsonData).to.have.property(\"cost\");",
                  "    pm.expect(jsonData).to.have.property(\"workOrderId\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"type\": \"Preventive\",\n  \"cost\": 150\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/maintenance",
              "host": ["{{url}}"],
              "path": ["api", "maintenance"]
            },
            "description": "Schedules maintenance work order for an asset."
          },
          "response": [
            {
              "name": "Create Maintenance Example Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"type\": \"Preventive\",\n  \"cost\": 150\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/maintenance",
                  "host": ["{{url}}"],
                  "path": ["api", "maintenance"]
                }
              },
              "status": "Created",
              "code": 201,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"maint-7002\",\n  \"assetId\": \"ast-1001\",\n  \"assetName\": \"DeWalt Impact Driver\",\n  \"type\": \"Preventive\",\n  \"date\": \"2026-08-17\",\n  \"scheduledDate\": \"2026-08-17\",\n  \"cost\": 150,\n  \"technician\": \"Elena Rostova\",\n  \"status\": \"Scheduled\",\n  \"notes\": \"\",\n  \"workOrderId\": \"WO-5491\"\n}"
            }
          ]
        },
        {
          "name": "Get Consumables Inventory",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response is an array of inventory items\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(Array.isArray(jsonData)).to.be.true;",
                  "    if (jsonData.length > 0) {",
                  "        var item = jsonData[0];",
                  "        pm.expect(item).to.have.property(\"id\");",
                  "        pm.expect(item).to.have.property(\"name\");",
                  "        pm.expect(item).to.have.property(\"quantityOnHand\");",
                  "        pm.expect(item).to.have.property(\"minThreshold\");",
                  "        pm.expect(item).to.have.property(\"costPerUnit\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/inventory",
              "host": ["{{url}}"],
              "path": ["api", "inventory"]
            },
            "description": "Lists consumable inventory (RFID hard tags, adhesive inlays, zip ties)."
          },
          "response": [
            {
              "name": "List Inventory Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/inventory",
                  "host": ["{{url}}"],
                  "path": ["api", "inventory"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "[\n  {\n    \"id\": \"inv-301\",\n    \"name\": \"Gen2 UHF RFID Metal-Mount Hard Tags\",\n    \"category\": \"Consumables\",\n    \"quantityOnHand\": 250,\n    \"minThreshold\": 50,\n    \"reorderPoint\": 80,\n    \"unit\": \"tags\",\n    \"costPerUnit\": 2.45,\n    \"siteId\": \"site-01\",\n    \"siteName\": \"Downtown Metro Tower\"\n  },\n  {\n    \"id\": \"inv-302\",\n    \"name\": \"High-Tack EPC UHF Adhesive Inlays (Roll)\",\n    \"category\": \"Supplies\",\n    \"quantityOnHand\": 1200,\n    \"minThreshold\": 300,\n    \"reorderPoint\": 500,\n    \"unit\": \"labels\",\n    \"costPerUnit\": 0.35,\n    \"siteId\": \"site-01\",\n    \"siteName\": \"Downtown Metro Tower\"\n  }\n]"
            }
          ]
        },
        {
          "name": "Update Inventory Quantity",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200 OK\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Inventory quantity updated successfully\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData.quantityOnHand === 75 || jsonData.quantity === 75).to.be.true;",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"quantity\": 75\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/inventory/:id",
              "host": ["{{url}}"],
              "path": ["api", "inventory", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "inv-301",
                  "description": "Inventory SKU Unique Identifier"
                }
              ]
            },
            "description": "Modifies consumable stock level or reorder point."
          },
          "response": [
            {
              "name": "Update Inventory Example Response",
              "originalRequest": {
                "method": "PATCH",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"quantity\": 75\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/inventory/:id",
                  "host": ["{{url}}"],
                  "path": ["api", "inventory", ":id"],
                  "variable": [
                    {
                      "key": "id",
                      "value": "inv-301"
                    }
                  ]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"inv-301\",\n  \"name\": \"Gen2 UHF RFID Metal-Mount Hard Tags\",\n  \"category\": \"Consumables\",\n  \"quantityOnHand\": 75,\n  \"minThreshold\": 50,\n  \"reorderPoint\": 80,\n  \"unit\": \"tags\",\n  \"costPerUnit\": 2.45,\n  \"siteId\": \"site-01\",\n  \"siteName\": \"Downtown Metro Tower\"\n}"
            }
          ]
        }
      ]
    },
    {
      "name": "Users",
      "description": "Personnel management, security badges, access control roles, and operator directory.",
      "item": [
        {
          "name": "Get All Users",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response is an array of users\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(Array.isArray(jsonData)).to.be.true;",
                  "    if (jsonData.length > 0) {",
                  "        var u = jsonData[0];",
                  "        pm.expect(u).to.have.property(\"id\");",
                  "        pm.expect(u).to.have.property(\"name\");",
                  "        pm.expect(u).to.have.property(\"email\");",
                  "        pm.expect(u).to.have.property(\"role\");",
                  "        pm.expect(u).to.have.property(\"badgeId\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/users",
              "host": ["{{url}}"],
              "path": ["api", "users"]
            },
            "description": "Lists all authorized personnel, site managers, and field staff."
          },
          "response": [
            {
              "name": "List Users Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/users",
                  "host": ["{{url}}"],
                  "path": ["api", "users"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "[\n  {\n    \"id\": \"usr-1\",\n    \"name\": \"Sarah Jenkins\",\n    \"email\": \"sjenkins@aperture.io\",\n    \"role\": \"Site Manager\",\n    \"badgeId\": \"BDG-8801\",\n    \"siteAccess\": [\"site-01\", \"site-02\"],\n    \"avatarUrl\": \"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400\",\n    \"phone\": \"+1 (555) 019-2831\"\n  },\n  {\n    \"id\": \"usr-2\",\n    \"name\": \"Marcus Vance\",\n    \"email\": \"mvance@aperture.io\",\n    \"role\": \"Yard Master\",\n    \"badgeId\": \"BDG-4019\",\n    \"siteAccess\": [\"site-01\"],\n    \"avatarUrl\": \"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400\",\n    \"phone\": \"+1 (555) 014-9923\"\n  }\n]"
            }
          ]
        },
        {
          "name": "Create User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201 Created\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "pm.test(\"User successfully registered with credentials\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"name\", \"Elena Rostova\");",
                  "    pm.expect(jsonData).to.have.property(\"email\", \"erostova@aperture.io\");",
                  "    pm.expect(jsonData).to.have.property(\"role\", \"Site Supervisor\");",
                  "    pm.expect(jsonData).to.have.property(\"badgeId\", \"BDG-3042\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Elena Rostova\",\n  \"email\": \"erostova@aperture.io\",\n  \"role\": \"Site Supervisor\",\n  \"badgeId\": \"BDG-3042\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/users",
              "host": ["{{url}}"],
              "path": ["api", "users"]
            },
            "description": "Registers a new user or site operator."
          },
          "response": [
            {
              "name": "Create User Example Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Elena Rostova\",\n  \"email\": \"erostova@aperture.io\",\n  \"role\": \"Site Supervisor\",\n  \"badgeId\": \"BDG-3042\"\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/users",
                  "host": ["{{url}}"],
                  "path": ["api", "users"]
                }
              },
              "status": "Created",
              "code": 201,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"usr-1002\",\n  \"name\": \"Elena Rostova\",\n  \"email\": \"erostova@aperture.io\",\n  \"role\": \"Site Supervisor\",\n  \"badgeId\": \"BDG-3042\",\n  \"siteAccess\": [\"site-01\"],\n  \"avatarUrl\": \"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400\",\n  \"phone\": \"+1 (555) 019-2831\"\n}"
            }
          ]
        },
        {
          "name": "Update User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200 OK\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"User profile and role updated\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "    pm.expect(jsonData).to.have.property(\"name\");",
                  "    pm.expect(jsonData).to.have.property(\"role\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Sarah Jenkins\",\n  \"role\": \"Senior Site Director\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/users/:id",
              "host": ["{{url}}"],
              "path": ["api", "users", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "usr-1",
                  "description": "User Unique Identifier"
                }
              ]
            },
            "description": "Updates personnel roles, badge assignments, or site access."
          },
          "response": [
            {
              "name": "Update User Example Response",
              "originalRequest": {
                "method": "PUT",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"name\": \"Sarah Jenkins\",\n  \"role\": \"Senior Site Director\"\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/users/:id",
                  "host": ["{{url}}"],
                  "path": ["api", "users", ":id"],
                  "variable": [
                    {
                      "key": "id",
                      "value": "usr-1"
                    }
                  ]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"id\": \"usr-1\",\n  \"name\": \"Sarah Jenkins\",\n  \"email\": \"sjenkins@aperture.io\",\n  \"role\": \"Senior Site Director\",\n  \"badgeId\": \"BDG-8801\",\n  \"siteAccess\": [\"site-01\", \"site-02\"],\n  \"avatarUrl\": \"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400\",\n  \"phone\": \"+1 (555) 019-2831\"\n}"
            }
          ]
        },
        {
          "name": "Delete User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200 OK\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Response confirms user deletion\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"success\", true);",
                  "    pm.expect(jsonData).to.have.property(\"id\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/users/:id",
              "host": ["{{url}}"],
              "path": ["api", "users", ":id"],
              "variable": [
                {
                  "key": "id",
                  "value": "usr-1",
                  "description": "User Unique Identifier"
                }
              ]
            },
            "description": "Deletes a user account."
          },
          "response": [
            {
              "name": "Delete User Example Response",
              "originalRequest": {
                "method": "DELETE",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/users/:id",
                  "host": ["{{url}}"],
                  "path": ["api", "users", ":id"],
                  "variable": [
                    {
                      "key": "id",
                      "value": "usr-1"
                    }
                  ]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"success\": true,\n  \"id\": \"usr-1\"\n}"
            }
          ]
        }
      ]
    },
    {
      "name": "System",
      "description": "Health checks, executive metrics summary, hardware streaming controls, and API endpoint audit telemetry.",
      "item": [
        {
          "name": "Get System Health",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"System health report is online\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"status\", \"ok\");",
                  "    pm.expect(jsonData).to.have.property(\"service\");",
                  "    pm.expect(jsonData).to.have.property(\"mongoConnected\");",
                  "    pm.expect(jsonData).to.have.property(\"uptime\");",
                  "    pm.expect(jsonData).to.have.property(\"timestamp\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/health",
              "host": ["{{url}}"],
              "path": ["api", "health"]
            },
            "description": "Checks system engine and database connectivity health."
          },
          "response": [
            {
              "name": "System Health Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/health",
                  "host": ["{{url}}"],
                  "path": ["api", "health"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"status\": \"ok\",\n  \"service\": \"Aperture RFID Asset Tracking Engine\",\n  \"database\": \"MongoDB Atlas (aperture_asset_db)\",\n  \"mongoConnected\": true,\n  \"uptime\": 14205.84,\n  \"timestamp\": \"{{$isoTimestamp}}\"\n}"
            }
          ]
        },
        {
          "name": "Get Reports Summary",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Executive summary has complete fleet analytics\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"totalAssetValue\");",
                  "    pm.expect(jsonData).to.have.property(\"totalAssets\");",
                  "    pm.expect(jsonData).to.have.property(\"checkedOutCount\");",
                  "    pm.expect(jsonData).to.have.property(\"inZoneCount\");",
                  "    pm.expect(jsonData).to.have.property(\"missingCount\");",
                  "    pm.expect(jsonData).to.have.property(\"utilizationRate\");",
                  "    pm.expect(jsonData).to.have.property(\"criticalAlertsCount\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/reports/summary",
              "host": ["{{url}}"],
              "path": ["api", "reports", "summary"]
            },
            "description": "Calculates fleet capital valuation, active utilization percentage, and loss metrics."
          },
          "response": [
            {
              "name": "Reports Summary Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/reports/summary",
                  "host": ["{{url}}"],
                  "path": ["api", "reports", "summary"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"totalAssetValue\": 482500,\n  \"totalAssets\": 24,\n  \"checkedOutCount\": 6,\n  \"inZoneCount\": 16,\n  \"missingCount\": 1,\n  \"maintenanceCount\": 1,\n  \"utilizationRate\": 72,\n  \"lossPercentage\": 4.2,\n  \"criticalAlertsCount\": 1,\n  \"activeReadersCount\": 8,\n  \"sitesCount\": 3\n}"
            }
          ]
        },
        {
          "name": "Toggle Hardware Stream Mode",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Hardware stream config updated\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"isStreaming\");",
                  "    pm.expect(jsonData).to.have.property(\"offlineBufferMode\");",
                  "    pm.expect(jsonData).to.have.property(\"bufferedCount\");",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json",
                "type": "text"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"offlineBufferMode\": true\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{url}}/api/hardware/stream/toggle",
              "host": ["{{url}}"],
              "path": ["api", "hardware", "stream", "toggle"]
            },
            "description": "Toggles active tag pulse generation and offline buffer caching mode."
          },
          "response": [
            {
              "name": "Toggle Hardware Stream Example Response",
              "originalRequest": {
                "method": "POST",
                "header": [
                  {
                    "key": "Content-Type",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "body": {
                  "mode": "raw",
                  "raw": "{\n  \"offlineBufferMode\": true\n}",
                  "options": {
                    "raw": {
                      "language": "json"
                    }
                  }
                },
                "url": {
                  "raw": "{{url}}/api/hardware/stream/toggle",
                  "host": ["{{url}}"],
                  "path": ["api", "hardware", "stream", "toggle"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"isStreaming\": true,\n  \"eventsPerMinute\": 12,\n  \"offlineBufferMode\": true,\n  \"bufferedCount\": 14\n}"
            }
          ]
        },
        {
          "name": "Get API Endpoint Logs",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test(\"Logs data contains category, module, tagCount, uniqueEpcs, and success fields\", function () {",
                  "    var jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property(\"success\", true);",
                  "    pm.expect(jsonData).to.have.property(\"data\");",
                  "    pm.expect(Array.isArray(jsonData.data)).to.be.true;",
                  "    if (jsonData.data.length > 0) {",
                  "        var log = jsonData.data[0];",
                  "        pm.expect(log).to.have.property(\"timestamp\");",
                  "        pm.expect(log).to.have.property(\"method\");",
                  "        pm.expect(log).to.have.property(\"endpoint\");",
                  "        pm.expect(log).to.have.property(\"status\");",
                  "        pm.expect(log).to.have.property(\"category\");",
                  "        pm.expect(log).to.have.property(\"module\");",
                  "        pm.expect(log).to.have.property(\"tagCount\");",
                  "        pm.expect(log).to.have.property(\"uniqueEpcs\");",
                  "        pm.expect(log).to.have.property(\"success\");",
                  "    }",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Accept",
                "value": "application/json",
                "type": "text"
              }
            ],
            "url": {
              "raw": "{{url}}/api/logs",
              "host": ["{{url}}"],
              "path": ["api", "logs"]
            },
            "description": "Returns structured API request logs with category, module, tagCount, uniqueEpcs, and success indicators."
          },
          "response": [
            {
              "name": "API Logs Example Response",
              "originalRequest": {
                "method": "GET",
                "header": [
                  {
                    "key": "Accept",
                    "value": "application/json",
                    "type": "text"
                  }
                ],
                "url": {
                  "raw": "{{url}}/api/logs",
                  "host": ["{{url}}"],
                  "path": ["api", "logs"]
                }
              },
              "status": "OK",
              "code": 200,
              "_postman_previewlanguage": "json",
              "header": [
                {
                  "key": "Content-Type",
                  "value": "application/json"
                }
              ],
              "cookie": [],
              "body": "{\n  \"success\": true,\n  \"data\": [\n    {\n      \"timestamp\": \"{{$isoTimestamp}}\",\n      \"method\": \"GET\",\n      \"endpoint\": \"/api/gao/getTagsInRealTime\",\n      \"status\": 200,\n      \"responseTime\": 42,\n      \"category\": \"RFID_STREAM\",\n      \"module\": \"GAO_GATEWAY\",\n      \"tagCount\": 3,\n      \"uniqueEpcs\": 3,\n      \"authenticated\": true,\n      \"requestId\": \"req-98a1f2\",\n      \"errorMessage\": null,\n      \"success\": true\n    }\n  ]\n}"
            }
          ]
        }
      ]
    }
  ]
};
