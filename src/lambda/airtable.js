const Airtable = require('airtable')
const axios = require('axios')

const saveContact = async data => {
  return new Promise((resolve, reject) => {
    const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env

    Airtable.configure({
      AIRTABLE_API_KEY,
    })

    const base = Airtable.base(AIRTABLE_BASE_ID)

    // formName directs data to correct base
    base(data.formName).create(data, err => {
      if (err) return reject(err)
      resolve()
    })
  })
}

const postToSlack = async data => {
  const { SLACK } = process.env
  const gameForm = data.formName === 'Games'
  let payload
  if (gameForm) {
    payload = {
      text: `*New Game!* \n *Name:* ${data.name}\n *Email:* ${data.email}\n *Link:* ${data.gameLink}`,
    }
  } else {
    payload = {
      text: `*New Contact!* \n *Name:* ${data.name}\n *Email:* ${data.email}\n *Message:* ${data.message}`,
    }
  }
  return new Promise((resolve, reject) =>
    axios
      .post(SLACK, JSON.stringify(payload))
      .then(response => {
        console.log('SUCCEEDED: Sent slack webhook: \n', response.data)
        resolve()
      })
      .catch(error => {
        console.log('FAILED: Send slack webhook', error)
        reject()
      })
  )
}

export async function handler(event) {
  try {
    const data = JSON.parse(event.body)
    await saveContact(data)
    await postToSlack(data)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data saved and slack notification sent',
      }),
    }
  } catch (error) {
    console.log(error)
    return {
      statusCode: 500,
      body: error.message,
    }
  }
}
