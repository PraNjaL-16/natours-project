/*********************************************************************/
/***************** CATCHING ERROR IN ASYNC FUNCTIONS *****************/
// we need the next function in order to pass the error into it so that that error can then be handled in the global error handling middleware
// if the next function receives an argument, then Express will automatically know that there was an error
// fn is a asynchronous functions, so it will return a promises. And when there is an error inside of an async function, that basically means that the promise gets rejected & then we can catch that error
module.exports = (fn) => {
  return (req, res, next) => {
    // fn(req, res, next).catch((err) => next(err));

    // re-writing above commented code
    // error will be automatically created by mongoDB & will be handled by our GLOBAL error handling middleware
    fn(req, res, next).catch(next);
  };
};
