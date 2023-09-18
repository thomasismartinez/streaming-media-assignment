const fs = require('fs');
const path = require('path');

// get media
const getMedia = (request, response, fileName, fileExtension) => {
  // path to media file
  const file = path.resolve(__dirname, `../client/${fileName}.${fileExtension}`);

  fs.stat(file, (err, stats) => {
    // if there is an error
    if (err) {
      // if the error is because the file cannot be found
      if (err === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    // get range of media to play
    let { range } = request.headers;
    if (!range) {
      range = 'bytes=0-';
    }

    // check for/get end position
    const positions = range.replace(/bytes=/, '').split('-');
    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    // determine size of chunk being sent to browser
    const chunksize = (end - start) + 1;

    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });

    // stream media
    const stream = fs.createReadStream(file, { end, start });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};

// export for server.js
module.exports.getMedia = getMedia;
