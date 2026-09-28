#!/bin/bash

API_KEY="E98D385B-12FA-4FA0-8C4C-93425FF29961"
QUESTION="Hello, what can you do for FacultyWise?"

curl -X POST "https://innovatechservicesph.com/management/microservices.php?service=ai-chat" \
     -H "Content-Type: application/json" \
     -d "{\"api_key\": \"$API_KEY\", \"question\": \"$QUESTION\"}"
