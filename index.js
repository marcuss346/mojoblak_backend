const { application } = require('express');
const cors = require('cors');
const express = require('express');
const fileUpload = require('express-fileupload');
const { PrismaClient } = require('@prisma/client');
const minio = require('minio');
const { checkAuth } = require('./routes/functions/checkauth');

const prisma = new PrismaClient();

const server = express();
server.use(express.json());
server.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
  }),
);
server.use(
  fileUpload({
    defCharset: 'utf8',
    defParamCharset: 'utf8',
  }),
);

const auth = require('./routes/auth/auth.js');
const register = require('./routes/auth/register.js');
const file = require('./routes/file_handling/files.js');
const forgot = require('./routes/auth/forgot');

server.use(auth);
server.use(register);
server.use(file);
server.use(forgot);

server.post('/userInfo', async (req, res) => {
  const data = req.body.data;

  const SessionData = await checkAuth(data.Token);

  console.log(SessionData);

  if (SessionData == false) {
    res.send({ auth: false });
  } else {
    console.log(SessionData);

    const userInfo = await prisma.Users.findMany({
      where: {
        userID: SessionData.userID,
      },
    });

    console.log(userInfo);

    res.send(userInfo[0]);
  }
});

server.listen(3011, () => {
  console.log('listening on port 3011');
});
