const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { checkAuth } = require('../functions/checkauth');
const minio = require('minio');

const prisma = new PrismaClient();
const minios = new minio.Client({
  endPoint: 's3.eu-west-2.wasabisys.com',
  accessKey: 'MCUVHLPPN8PBSJACJBWH',
  secretKey: 'hw2CvpmJ99pwwnFJGk9ndSOPa9YDr2ySqAPVghBT',
});

const forgot = express.Router();

function makeid(length) {
  let result = '';
  let characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// forgot.post('/forgotPassword', async (req, res) => {
//   const a = req.body.data;
//   const uporabnik = await prisma.Users.findMany({
//     where: {
//       email: a.email,
//     },
//   });

//   const date = new Date();
//   let finaldate = '';

//   let year = date.getFullYear();
//   let month = date.getMonth();
//   let day = date.getDate() + 1;

//   if (day > 30) {
//     day = 1;
//     month++;
//   }
//   if (month > 12) {
//     month = 1;
//     year++;
//   }

//   if (month < 10 && day < 10) {
//     finaldate = year + '-0' + month + '-0' + day + 'T00:00:00.0000Z';
//   } else if (month < 10) {
//     finaldate = year + '-0' + month + '-' + day + 'T00:00:00.0000Z';
//   } else if (day < 10) {
//     finaldate = year + '-' + month + '-0' + day + 'T00:00:00.0000Z';
//   }

//   if (uporabnik.length != 0) {
//     const resetToken = {
//       Token: makeid(100),
//       UserID: uporabnik[0].userID,
//       expires: finaldate,
//     };

//     console.log(resetToken);

//     const dt = await prisma.ForgotPassword.create({ data: resetToken });

//     let url = `${process.env.FRONTEND_URL}/resetPassword?token=${resetToken.Token}`;

//     console.log(url);
//   } else {
//     res.send('User Not Found');
//   }
// });

// forgot.post('/updatePassword', async (req, res) => {
//   console.log(req.body.data);
//   const getTokenData = await prisma.ForgotPassword.findMany({
//     where: {
//       Token: req.body.data.token,
//     },
//   });

//   console.log(getTokenData);
// });

forgot.post('/deleteUser', async (req, res) => {
  console.log(req.body.data);
  const b = await checkAuth(req.body.data.Token);
  console.log(b);

  if (b == false) {
    res.sendStatus(403);
    return;
  } else {
    const datoteke = await prisma.datoteka.findMany({
      where: { owner: b.userID },
      select: { path: true },
    });
    let err = false;
    console.log(datoteke);
    datoteke.forEach(async (dat) => {
      const aaa = await minios.removeObject('mojoblakdev', dat.path);
    });
    if (!err) {
      const g = await prisma.datoteka.deleteMany({
        where: { owner: b.userID },
      });
      const f = await prisma.trash.deleteMany({
        where: { owner: b.userID },
      });
      const m = await prisma.session.deleteMany({
        where: { UserID: b.userID },
      });
      const final = await prisma.users.deleteMany({
        where: { userID: b.userID },
      });
      res.status(200).send('user deleted');
    }
  }
});

module.exports = forgot;
