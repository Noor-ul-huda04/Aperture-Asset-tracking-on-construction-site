export const aperturePostmanCollection = {
  "info": {
    "_postman_id": "gao-rfid-uhf-tracking-apis-v1",
    "name": "GAO RFID UHF People & Asset Tracking API",
    "description": "Official Web APIs implemented by GAO RFID INC. for people and asset tracking. Server host: https://www.i360services.com/peopletrackinguhf. Hardware demo setup: 1 reader with 2 antennas, each covering a zone (Zone1, Zone2).",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "host",
      "value": "https://www.i360services.com/peopletrackinguhf",
      "type": "string",
      "description": "GAO RFID UHF Server Host URL"
    }
  ],
  "item": [
    {
      "name": "1. Get History Total Count",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Accept",
            "value": "application/json, text/plain, */*"
          }
        ],
        "url": {
          "raw": "{{host}}/api/GetHistoryTotalCount",
          "host": [
            "{{host}}"
          ],
          "path": [
            "api",
            "GetHistoryTotalCount"
          ]
        },
        "description": "Function: GAO software will accept this request and return a total number of the history data in GAO software system.\n\nResponse Example:\n100\n(100 means that there are 100 history data in total in the cloud server. 0 means that there is no any history data.)"
      },
      "response": [
        {
          "name": "200 OK - History Count Example",
          "originalRequest": {
            "method": "GET",
            "url": {
              "raw": "{{host}}/api/GetHistoryTotalCount"
            }
          },
          "status": "OK",
          "code": 200,
          "_postman_previewlanguage": "text",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json; charset=utf-8"
            }
          ],
          "body": "100"
        }
      ]
    },
    {
      "name": "2. Get Specific History Data",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Accept",
            "value": "application/json, text/plain, */*"
          }
        ],
        "url": {
          "raw": "{{host}}/api/GetHistoryRecords/0/30",
          "host": [
            "{{host}}"
          ],
          "path": [
            "api",
            "GetHistoryRecords",
            "0",
            "30"
          ]
        },
        "description": "Function: Get specific history data by some parameters.\nWhen getting this request, GAO system will order the history data by the generated time in descending order.\n\nParameters:\n- SkipCount: Number of skipping the history data from the beginning.\n- TakeCount: Number of returning the history data for this request. The max value is 200.\n\nIf the number of returned history data is less than TakeCount, it means that it gets the end of the history data and there is no more history data in the cloud server.\n\nDuration: unit is hours (LeaveTime minus EnterTime)."
      },
      "response": [
        {
          "name": "200 OK - History Records Example",
          "originalRequest": {
            "method": "GET",
            "url": {
              "raw": "{{host}}/api/GetHistoryRecords/10/30"
            }
          },
          "status": "OK",
          "code": 200,
          "_postman_previewlanguage": "json",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json; charset=utf-8"
            }
          ],
          "body": "[\n  {\n    \"TagID\": \"E28011606000020788842D31\",\n    \"FirstName\": \"John\",\n    \"LastName\": \"Smith\",\n    \"LocationName\": \"d6\",\n    \"EnterTime\": \"2026-06-02 15:27:02\",\n    \"LeaveTime\": \"2026-06-02 15:57:02\",\n    \"Duration\": 0.5\n  },\n  {\n    \"TagID\": \"E28011606000020788842D31\",\n    \"FirstName\": \"Jack\",\n    \"LastName\": \"Wince\",\n    \"LocationName\": \"d8\",\n    \"EnterTimeStr\": \"2026-04-28 10:17:42\",\n    \"LeaveTimeStr\": \"2026-04-28 11:47:42\",\n    \"Duration\": 1.5\n  }\n]"
        }
      ]
    },
    {
      "name": "3. Get Tags in Real-time",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Accept",
            "value": "application/json, text/plain, */*"
          }
        ],
        "url": {
          "raw": "{{host}}/api/GetTagsInRealtime",
          "host": [
            "{{host}}"
          ],
          "path": [
            "api",
            "GetTagsInRealtime"
          ]
        },
        "description": "Function: Get tags data reported by the reader.\nDemo Hardware Setup: 1 reader and the reader has 2 antennas, each antenna is covering a zone (Zone1, Zone2).\n\nWhen getting this request, GAO system will order the tag raw data by the generated time in descending order. GAO software will extract all the current raw data from the tags queue and put them in the response."
      },
      "response": [
        {
          "name": "200 OK - Real-Time Tags Example",
          "originalRequest": {
            "method": "GET",
            "url": {
              "raw": "{{host}}/api/GetTagsInRealtime"
            }
          },
          "status": "OK",
          "code": 200,
          "_postman_previewlanguage": "json",
          "header": [
            {
              "key": "Content-Type",
              "value": "application/json; charset=utf-8"
            }
          ],
          "body": "[\n  {\n    \"TagID\": \"E28011606000020788842D31\",\n    \"Timestamp\": \"2026-06-02 20:30:18.222\",\n    \"Location\": \"Zone1\"\n  },\n  {\n    \"TagID\": \"E28011606000020788842D31\",\n    \"Timestamp\": \"2026-06-02 20:30:17.097\",\n    \"Location\": \"Zone1\"\n  },\n  {\n    \"TagID\": \"E28011606000020788842D31\",\n    \"Timestamp\": \"2026-06-02 20:30:15.925\",\n    \"Location\": \"Zone1\"\n  }\n]"
        }
      ]
    }
  ]
};

