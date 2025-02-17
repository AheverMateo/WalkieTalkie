const https = require('./src/server');
const sequelize = require("./src/db")

sequelize.sync({ force: false }).then(()=> {
  https.listen(3000, () => {
    console.log('App listening on port 3000');
  });
})
.catch((err)=> console.log(err));

