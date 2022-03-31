#!/bin/bash

PARAMS=""
FILTERS=""
if [[ ! -z $1 ]]; then
	PARAMS="-- -t $1"
	FILTERS='| startswith("'"$1"'")'
fi

npm run -s test:ls $PARAMS | jq '.testResults[] | .assertionResults[] | select(.ancestorTitles[0] '"$FILTERS"' ) | .fullName'
