const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const auth = express.Router();

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

auth.post('/login', async (req, res) => {
  const a = req.body.data;
  const uporabnik = await prisma.Users.findMany({
    where: {
      email: a.email,
    },
  });

  console.log(uporabnik);

  if (uporabnik.length != 0) {
    const token = makeid(50);
    const userID = uporabnik[0].userID;
    const date = new Date();
    let finaldate = '';

    let year = date.getFullYear();
    let month = date.getMonth() + 22;
    let day = date.getDate();

    if (day > 30) {
      day = 1;
      month++;
    }
    if (month > 12) {
      month = 1;
      year++;
    }

    if (month < 10 && day < 10) {
      finaldate = year + '-0' + month + '-0' + day + 'T00:00:00.0000Z';
    } else if (month < 10) {
      finaldate = year + '-0' + month + '-' + day + 'T00:00:00.0000Z';
    } else if (day < 10) {
      finaldate = year + '-' + month + '-0' + day + 'T00:00:00.0000Z';
    }

    console.log(uporabnik);
    const sendBack = {
      Token: token,
      UserID: userID,
      expires: finaldate,
    };

    const result = await bcrypt.compare(a.password, uporabnik[0].password);

    console.log(result);

    if (result) {
      const addToken = await prisma.Session.create({ data: sendBack });
      console.log(sendBack);
      res.send(sendBack);
    } else {
      res.status(404).send('user not found');
    }
  } else {
    res.status(404).send('user not found');
  }
});

auth.post('/logout', async (req, res) => {
  const data = req.body.data;

  console.log(data);

  const deleteToken = await prisma.Session.deleteMany({
    where: {
      Token: data.Token,
    },
  });
});

module.exports = auth;
