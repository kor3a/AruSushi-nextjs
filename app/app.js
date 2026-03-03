const axios = require('axios')
const jwt = require('jsonwebtoken')

const developerId = process.env.DOORDASH_DEVELOPER_ID
const keyId = process.env.DOORDASH_KEY_ID
const signingSecret = process.env.DOORDASH_SIGNING_SECRET

if (!developerId || !keyId || !signingSecret) {
  throw new Error(
    'Missing DoorDash credentials. Set DOORDASH_DEVELOPER_ID, DOORDASH_KEY_ID, and DOORDASH_SIGNING_SECRET (run with "node --env-file=../.env app.js" if needed).',
  )
}

const payload = {
  aud: 'doordash',
  iss: developerId,
  kid: keyId,
  exp: Math.floor(Date.now() / 1000) + 300,
  iat: Math.floor(Date.now() / 1000),
}

const token = jwt.sign(payload, Buffer.from(signingSecret, 'base64'), {
  algorithm: 'HS256',
  header: {
    'dd-ver': 'DD-JWT-V1',
    alg: 'HS256',
    typ: 'JWT',
    kid: keyId,
  },
})

console.log(token)

const body = {
  external_delivery_id: 'D-12345',
  pickup_address: '901 Market Street 6th Floor San Francisco, CA 94103',
  pickup_business_name: 'Wells Fargo SF Downtown',
  pickup_phone_number: '+16505555555',
  pickup_instructions: 'Enter gate code 1234 on the callbox.',
  dropoff_address: '901 Market Street 6th Floor San Francisco, CA 94103',
  dropoff_business_name: 'Wells Fargo SF Downtown',
  dropoff_phone_number: '+16505555555',
  dropoff_instructions: 'Enter gate code 1234 on the callbox.',
  order_value: 1999,
}

axios
  .post('https://openapi.doordash.com/drive/v2/deliveries', body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  .then((response) => {
    console.log(response.data)
  })
  .catch((error) => {
    console.error(error.response?.data || error.message)
  })
