# a2s_sqe

[![npm version](https://badge.fury.io/js/a2s_sqe.svg)](https://badge.fury.io/js/na2s_sqe)

Source Queries for Node.JS, which supports promises
More info https://developer.valvesoftware.com/wiki/Server_queries

## Usage

Install the package by typing `npm i a2s_sqe` in your project folder.

### Setup

```javascript
const A2S = require("a2s_sqe");

const SQE = new A2S();
```

### Get info Server

```javascript
    SQE.getInfo('127.0.0.1', 27015).then((info) => console.log(info));
  //OR

  const Info = await SQE.getInfo('127.0.0.1', 27015);
  console.log(Info)
```

#### Return

```javascript
      //JSON
   {  netver: 17,
      serverName: 'SERVER NAME',
      map: 'map_name',
      gameDir: 'csgo',
      gameDesc: 'Counter-Strike',
      appID: 730,
      numPlayers: 21,
      maxPlayers: 32,
      numBots: 1,
      serverType: 'd',
      OS: 'l',
      password: 0,
      vacSecured: 1,
      gameVersion: '0.0.0.0',
      EDF: 241,
      port: 27015,
      steamID: 'Buffer <>',
      sourceTV: { port: 27020, name: '' },
      keywords: 'empty,game tags',
      gameID: 730
    }
```


### Get Server Players

```javascript
  SQE.getPlayers('127.0.0.1', 27015).then((players) => console.log(players));
  //OR
  const Players = await SQE.getPlayers('127.0.0.1', 27015);
  console.log(Players)
```

#### Return Data

```javascript
    //Array
   [{ index: 0, name: 'Player Name', score: 1, duration: 1 },
    { index: 0, name: 'Player Name', score: 2, duration: 2 },
    { index: 0, name: 'Player Name', score: 3, duration: 3 }, ...
   ]
```
