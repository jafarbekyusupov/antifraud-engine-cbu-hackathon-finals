#!/usr/bin/env bash
set -euo pipefail

base_url="${1:-${BASE_URL:-http://localhost:3000}}"
client_id="${CLIENT_ID:-C00426}"
card_id="${CARD_ID:-K000643}"
city="${CITY:-Toshkent}"
latitude="${LATITUDE:-41.2995}"
longitude="${LONGITUDE:-69.2401}"
run_prefix="$(date -u +%H%M%S)"

merchant_ids=(M00003 M00004 M00005)
mccs=(5411 5541 4111)
challenge_id=''

for index in 0 1 2; do
  sequence=$((index + 1))
  transaction_id="D${run_prefix}0${sequence}"
  occurred_at="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
  response="$(curl --fail-with-body --silent --show-error \
    --request POST \
    --header 'Content-Type: application/json' \
    --data "{
      \"transactionId\": \"${transaction_id}\",
      \"cardId\": \"${card_id}\",
      \"clientId\": \"${client_id}\",
      \"occurredAt\": \"${occurred_at}\",
      \"amount\": 10000,
      \"currency\": \"UZS\",
      \"merchantId\": \"${merchant_ids[$index]}\",
      \"mcc\": \"${mccs[$index]}\",
      \"city\": \"${city}\",
      \"latitude\": ${latitude},
      \"longitude\": ${longitude},
      \"channel\": \"ECOM\",
      \"response\": \"OK\"
    }" \
    "${base_url}/api/v1/internal/transactions")"

  summary="$(python3 -c 'import json,sys; r=json.load(sys.stdin); print("{}: score={}, action={}, challenge={}".format(r["transactionId"], r["riskScore"], r["action"], r.get("challengeId")))' <<<"${response}")"
  printf '%s\n' "${summary}"
  current_challenge="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("challengeId") or "")' <<<"${response}")"
  if [[ -n "${current_challenge}" ]]; then challenge_id="${current_challenge}"; fi
done

if [[ -z "${challenge_id}" ]]; then
  printf '%s\n' 'No STEP_UP challenge was created. Restart the backend to clear recent in-memory card state and try again.' >&2
  exit 1
fi

curl --fail-with-body --silent --show-error \
  --header "x-authenticated-client-id: ${client_id}" \
  "${base_url}/api/v1/customer/security-challenges" | python3 -m json.tool

printf '\nChallenge %s created for customer %s. Refresh the customer UI now.\n' \
  "${challenge_id}" "${client_id}"
