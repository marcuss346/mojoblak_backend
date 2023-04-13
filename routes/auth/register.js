const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const register = express.Router();

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

register.post('/register', async (req, res) => {
  //console.log(req.body.data);
  const data = req.body.data;
  let iD = makeid(20);
  let error = false;
  let hashed = '';
  let message = '';

  const emails = await prisma.Users.findMany({
    select: {
      email: true,
      userID: true,
    },
  });

  emails.forEach((el) => {
    if (el.email == data.email) {
      error = true;
      message = 'email already in use';
    }
    if (el.userID == iD) {
      error = true;
      message = 'error in generating userID, try again';
    }
  });

  console.log(emails);

  bcrypt.hash(data.password, 10, async (err, hash) => {
    if (err) console.log(err);
    else {
      if (!error) {
        const newUserData = {
          userID: iD,
          email: data.email,
          password: hash,
          name: data.name,
          surname: data.surname,
        };

        const newUser = await prisma.Users.create({ data: newUserData }).catch(
          (e) => {
            console.error(e);
            res.status(400).send('error with database');
            return;
          },
        );

        res.send('user creation succsess');
      } else {
        res.status(400).send(message);
      }
    }
  });
});

module.exports = register;
