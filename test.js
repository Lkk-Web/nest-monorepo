const axios = require('axios')

for (let i = 0; i < 100; i++) {
  axios
    .post('http://127.0.0.1:10325/admin/v1/mi/login', {
      phone: 'string',
      password: 'string',
    })
    .then(response => {
      console.log('成功', i, response)
    })
    .catch(error => {
      console.log('失败', i, error)
    })
}
