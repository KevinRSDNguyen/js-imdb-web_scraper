const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");

const searchUrl = "https://www.imdb.com/find?&s=tt&ttype=ft&ref_=fn_ft&q=";
const movieUrl = "https://www.imdb.com/title/";

const searchCache = {};
const movieCache = {};

const searchMovies = searchTerm => {
  if (searchCache[searchTerm]) {
    console.log("Serving from cache:", searchTerm);
    return Promise.resolve(searchCache[searchTerm]);
  }
  const urlWithSearchTerm = `${searchUrl}${searchTerm}`;
  return axios
    .get(urlWithSearchTerm)
    .then(({ data }) => {
      return data;
    })
    .then(body => {
      const $ = cheerio.load(body);
      const movies = [];
      $(".findResult").each(function(i, element) {
        const $element = $(element);
        const $image = $element.find("img");
        const $title = $element.find("td.result_text a");
        const imdbID = $title.attr("href").match(/title\/(.*)\//)[1];
        const movie = {
          image: $image.attr("src"),
          title: $title.text(),
          imdbID
        };
        movies.push(movie);
      });
      searchCache[searchTerm] = movies;
      return movies;
    });
};

const getMovie = imdbID => {
  if (movieCache[imdbID]) {
    console.log("Serving from cache:", imdbID);
    return Promise.resolve(movieCache[imdbID]);
  }
  const urlWithSearchTerm = `${movieUrl}${imdbID}`;
  return axios
    .get(urlWithSearchTerm)
    .then(({ data }) => {
      return data;
    })
    .then(body => {
      const $ = cheerio.load(body);
      const $title = $(".title_wrapper h1");
      const title = $title
        .first()
        .contents()
        .filter(function() {
          // So we do not grab year released from span within the h1
          return this.type === "text";
        })
        .text()
        .trim();
      //Looks likes this: [ 'PG', '2h 1min', 'Action, \nAdventure, \nFantasy', '25 May 1977 (USA)' ]
      const subtextDivText = $(".subtext")
        .text()
        .split("|")
        .map(str => str.trim());
      // G, PG, PG13, R
      const rating = subtextDivText[0];
      const runTime = subtextDivText[1];
      const genres = subtextDivText[2]
        .replace("\n", "")
        .split(",")
        .map(str => str.trim());

      const dateReleased = moment(new Date(subtextDivText[3])).format(
        "MM-DD-YYYY"
      );
      const imdbRating = $(".ratingValue strong span").text();
      const poster = $(".poster img").attr("src");
      const summary = $(".summary_text")
        .text()
        .trim();

      function getItems(itemArray) {
        return function(i, element) {
          const item = $(element)
            .text()
            .trim();
          itemArray.push(item);
        };
      }

      const directors = [];
      $(".credit_summary_item")
        .first()
        .find("a")
        .each(getItems(directors));

      const writers = [];
      $(".credit_summary_item")
        .eq(1)
        .find("a")
        .each(getItems(writers));

      const stars = [];
      $(".credit_summary_item")
        .eq(2)
        .find("a")
        .each(getItems(stars));
      stars.pop(); // Remove the last item of array which is "See FUll Cast and Crew"

      const storyLine = $("#titleStoryLine div p span")
        .text()
        .trim();

      const trailer = `https://www.imdb.com${$(
        ".slate_wrapper a.video-modal"
      ).attr("href")}`;

      const movie = {
        imdbID,
        title,
        rating,
        runTime,
        genres,
        dateReleased,
        imdbRating,
        poster,
        summary,
        directors,
        writers,
        stars,
        storyLine,
        trailer
      };

      movieCache[imdbID] = movie;
      return movie;
    });
};

module.exports = { searchMovies, getMovie };
