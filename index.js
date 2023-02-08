const { application } = require('express');
const cors = require('cors');
const express = require('express');
const fileUpload = require('express-fileupload');
const { PrismaClient } = require('@prisma/client')
const minio = require('minio');
const { checkAuth } = require('./routes/functions/checkauth')

const prisma = new PrismaClient()
const minios = new minio.Client({
    endPoint: 's3.eu-west-2.wasabisys.com',
    accessKey: 'MCUVHLPPN8PBSJACJBWH',
    secretKey: 'hw2CvpmJ99pwwnFJGk9ndSOPa9YDr2ySqAPVghBT'
})



const server = express();
server.use(express.json());
server.use(cors());
server.use(fileUpload());



const auth = require('./routes/auth/auth.js');
const register = require('./routes/auth/register.js');


server.use(auth);
server.use(register);




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
                userID: SessionData.UserID
            }
        })

        console.log(userInfo);

        res.send(userInfo[0]);
    }
})


server.post('/uploadFile', async (req, res) => {
    console.log(req);
    console.log(req.files.file);
    let Token = req.body.owner;

    const Auth = await checkAuth(Token);

    if (Auth == false) {
        res.send('failed to upload file, authentication expired');
    } else {
        let key = Auth.UserID + '/' + req.files.file.name;
        let stream = req.files.file.data;


        minios.putObject('mojoblakdev', key, stream, (err, data) => {
            if (err) {
                return console.log(err) // err should be null
            }
            console.log("Success", data)
        });
        let dataBase = {
            owner: Auth.UserID,
            path: key,
            imeDatoteke: req.files.file.name,
        }
        const uploadKey = await prisma.datoteka.create({ data: dataBase });
    }

})

server.post('/getFiles', async (req, res) => {
    const Auth = checkAuth(req.body.data.Token);

    if (Auth == false) {
        res.send('No authentication')
    } else {
        const files = await prisma.datoteka.findMany({
            where: {
                owner: Auth.UserID
            },
            select: {
                path: true,
                imeDatoteke: true,
            }
        })

        res.send(files);
    }
})

server.post('/download', async (req, res) => {
    console.log(req.body.data);
    let path = req.body.data.path;


    minios.presignedGetObject('mojoblakdev', path, (err, link) => {
        if (err) console.log(err);
        else {
            console.log(link);
            res.send(link);
        }
    })


})



server.listen(3011, () => {
    console.log("listening on port 3011");
})