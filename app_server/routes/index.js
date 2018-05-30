var express = require('express');
var router = express.Router();
var ctrlLocations = require('./../controllers/location');
var ctrlOthers = require('./../controllers/other');

/* GET location pages */
router.get('/', ctrlLocations.homelist);
router.get('/location/:locationid', ctrlLocations.locationInfo);
router.get('/location/:locationid/review/new', ctrlLocations.addReview);
router.post('/location/:locationid/review/new', ctrlLocations.doAddReview);

/* GET Other pages */
router.get('/about', ctrlOthers.about);

module.exports = router;
