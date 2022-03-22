#!/bin/bash

npm run -s test:ls | jq '.testResults[] | .assertionResults[] | select(.ancestorTitles[0] | startswith("'"$1"'")) | .fullName'