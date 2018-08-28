const express = require("express");
const cors = require("cors");
const scraper = require("./scraper");

const app = express();
app.use(cors());

// /search/star wars
app.get("/search/:title", (req, res) => {
  scraper.searchMovies(req.params.title).then(movies => {
    res.json(movies);
  });
});

app.get("/movie/:imdbID", (req, res) => {
  scraper
    .getMovie(req.params.imdbID)
    .then(movie => {
      res.json(movie);
    })
    .catch(() => {
      res.send(`Movie with imdbid of ${req.params.imdbID} could not be found`);
    });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
