      // Module imports
const dgram = require('node:dgram'),
      pack = require('bufferpack'),
      int24 = require('int24'),

      // Message request formats
      A2S_INFO = Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x54, 0x53, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45, 0x6E, 0x67, 0x69, 0x6E, 0x65, 0x20, 0x51, 0x75, 0x65, 0x72, 0x79, 0x00]),
      A2S_PLAYER = Buffer.from([0xff, 0xff, 0xff, 0xff, 0x55]),
      A2S_RULES = Buffer.from([0xff, 0xff, 0xff, 0xff, 0x56]),
      CONCAT_BUFFER = Buffer.from([0xff, 0xff, 0xff, 0xff]);

/**
 * Class representing a server query.
 */
class A2S_SQE
{
  /**
   * Retrieves server information.
   * @param {string} ip - The server ip address.
   * @param {number} port - The server port.
   * @returns {Promise<Object>} The server information.
   */
  async getInfo(ip, port)
  {
    return this.#getRequestMethod(A2S_INFO, this.#infoDecoder, true)(ip, port);
  }

  /**
   * Retrieves player information.
   * @param {string} ip - The server ip address.
   * @param {number} port - The server port.
   * @returns {Promise<Array>} The list of players.
   */
  async getPlayers(ip, port)
  {
    return this.#getRequestMethod(A2S_PLAYER, this.#playersDecoder, true)(ip, port);
  }

  /**
   * Retrieves server rules.
   * @param {string} ip - The server ip address.
   * @param {number} port - The server port.
   * @returns {Promise<Array>} The list of rules.
   */
  async getRules(ip, port)
  {
    return this.#getRequestMethod(A2S_RULES, this.#rulesDecoder, true)(ip, port);
  }

  // Private methods

  /**
   * Sends a request to the server and handles the response.
   * @param {string} ip - The server ip address.
   * @param {number} port - The server port.
   * @param {Buffer} request - The request buffer.
   * @param {Function} decoder - The function to decode the response.
   * @returns {Promise<Object>} The decoded response.
   * @throws {Error} If it was not possible to unpack the server data or failed to retrieve server info.
   */
  async #a2s_Request(ip, port, request, decoder)
  {
    let combinedRequest, combinedLen;
    const socket = dgram.createSocket('udp4');
    
    return new Promise((resolve, reject) =>
    {
      const receiveData = (data) =>
      {
        socket.close();
        decoder(data.slice(5)).then(resolve).catch(reject);
      },

      receiveChallenge = (data) =>
      {
        this.#challengeCheck(data.slice(5))
        .then(challenge =>
        {
            challenge.copy(combinedRequest, request.length);
            socket.once('message', receiveData);
            socket.send(combinedRequest, 0, combinedLen, port, ip, errorHandler);
        })
        .catch(err =>
          {
            socket.close();
            reject(new Error(`Challenge decoding failed: ${err.message}`));
        });
      },

      errorHandler = (err) =>
      {
        if (err)
        {
          socket.close();
          reject(new Error(`Socket error: ${err.message}`));
        }
      },

      getType = (data) =>
      {
        let unpack;
        try { unpack = pack.unpack('<i(header)c(type)', data) }
        catch (err)
        {
          socket.close();
          return reject(new Error(`Failed to unpack data: ${err.message}`));
        }

        switch (unpack.type)
        {
          case 'A': socket.once('message', receiveChallenge); break;
          default: socket.once('message', receiveData);
        }

        combinedLen = request.length + 4;
        combinedRequest = Buffer.concat([request, CONCAT_BUFFER]);
        socket.send(combinedRequest, 0, combinedLen, port, ip, errorHandler);
      };

      socket.once('message', getType);
      combinedLen = request.length + 4;
      combinedRequest = Buffer.concat([request, CONCAT_BUFFER]);
      socket.send(combinedRequest, 0, combinedLen, port, ip, errorHandler);
    });
  }

  /**
   * Creates a request method for the specified request and decoder.
   * @param {Buffer} request - The request buffer.
   * @param {Function} decoder - The function to decode the response.
   * @returns {Function} The request method.
   */
  #getRequestMethod(request, decoder)
  {
    return (ip, port) => this.#a2s_Request(ip, port, request, decoder);
  }

  /**
   * Decodes the server information response.
   * @param {Buffer} data - The response data.
   * @returns {Promise<Object>} The decoded server information.
   * @throws {Error} If it was not possible to unpack the server data or failed to retrieve server info.
   */
  async #infoDecoder(data)
  {
    const fields = [
      'B(netver)', 'S(serverName)',
      'S(map)', 'S(gameDir)',
      'S(gameDesc)', 'H(appID)',
      'B(numPlayers)', 'B(maxPlayers)',
      'B(numBots)', 'c(serverType)',
      'c(OS)', 'B(password)',
      'B(vacSecured)', 'S(gameVersion)',
      'B(EDF)',
    ], 
    format = '<' + fields.join('');

    let srvData;

    try { srvData = pack.unpack(format, data) }
    catch (err) { throw new Error(`Failed to unpack server data: ${err.message}`) }

    const stringFields = [
        srvData.serverName,
        srvData.map,
        srvData.gameDir,
        srvData.gameDesc,
        srvData.gameVersion,
      ];
                  
    let position = 11 + stringFields.reduce((sum, field) => sum + field.length + 1, 0);

    if (!srvData) throw new Error('Failed to retrieve server info.');

    // Read in optional data values as specified by EDF
    try
    {
      if (srvData.EDF & 0x80)
      {
        srvData.port = pack.unpack('<H(port)', data, position).port;
        position += 2;
      }

      if (srvData.EDF & 0x10)
      {
        srvData.steamID = data.slice(position, position + 8);
        position += 8;
      }

      if (srvData.EDF & 0x40)
      {
        srvData.sourceTV = pack.unpack('<H(port)S(name)', data, position);
        position += 2 + srvData.sourceTV.name.length + 1;
      }

      if (srvData.EDF & 0x20)
      {
        srvData.keywords = pack.unpack('<S', data, position)[0];
        position += srvData.keywords.length + 1;
      }

      if (srvData.EDF & 0x01)
      {
        srvData.gameID = int24.readInt24LE(Buffer.from(data.slice(position, position + 8)), 0);
        position += 8;
      }

      srvData.serverName = data.toString('utf8', 1, 1 + srvData.serverName.length);
    }
    catch (err) { throw new Error(`Failed to read optional server info: ${err.message}`) }

    return srvData;
  }

  /**
   * Decodes the player information response.
   * @param {Buffer} data - The response data.
   * @returns {Promise<Array>} The list of players.
   * @throws {Error} If it was not possible to unpack the player data.
   */
  async #playersDecoder(data)
  {
    const players = [];
    let position = 1; // skip past the initial byte

    while (position < data.length)
    {
      const player =
      {
        index: data[position++],
        name: '',
        score: 0,
        duration: 0,
      };

      // Read player name
      let ch = data[position], strLen = 1;

      while (ch !== 0 && (position + strLen) < data.length)
      {
        ch = data[position + strLen];
        strLen++;
      }

      player.name = data.toString('utf8', position, position + strLen - 1);
      position += strLen;

      try
      {
        const rem = pack.unpack('<l(score)f(duration)', data, position);
        player.score = rem.score;
        player.duration = rem.duration;
        position += 8;
      }
      catch (err) { throw new Error(`Failed to unpack player data: ${err.message}`)}

      players.push(player);
    }

    return players;
  }

  /**
   * Decodes the server rules response.
   * @param {Buffer} data - The response data.
   * @returns {Promise<Array>} The list of rules.
   * @throws {Error} If the length of the data is not equal to the number.
   */
  async #rulesDecoder(data)
  {
    const rulesCount = pack.unpack('<H(count)').count, rules = [];
    let position = 1; // skip past the initial byte

    while (true)
    {
      const rule = pack.unpack('<S(name)S(value)', data, position);
      if (!rule) break;
      rules.push(rule);
      position += rule.name.length + 1 + rule.value.length + 1;
    }

    if (rulesCount !== rules.length)
      throw new Error(`Did not receive the expected number of rules. Expected: ${rulesCount}, but saw: ${rules.length}`);

    return rules;
  }

  /**
   * Checks the challenge response for validity.
   * @param {Buffer} data - The response data to check.
   * @returns {Promise<Buffer>} The original challenge data if valid.
   * @throws {Error} If the data length is not 4 bytes.
   */
  async #challengeCheck(data)
  {
    if (data.length !== 4) 
      throw new Error('Challenge not 4 bytes');

    return data;
  }
}

module.exports = A2S_SQE;