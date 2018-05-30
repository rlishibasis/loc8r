var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

var buildLocationList = function(req, res, results) {
    console.log('buildLocationList:');
    var locations = [];
    results.forEach(function(doc) {
        locations.push({
          distance: doc.dist.calculated,
          name: doc.name,
          address: doc.address,
          rating: doc.rating,
          facilities: doc.facilities,
          _id: doc._id
        });
    });
    return locations;
};

module.exports.locationsListByDistance = function (req, res) {
    var lng = parseFloat(req.query.lng);
    var lat = parseFloat(req.query.lat);
    var maxDistance = parseFloat(req.query.maxDistance);
    var calculateDistance = parseFloat(maxDistance*1000);
    var point = {
        type: "Point",
        coordinates: [lng, lat]
    };
    if ((!lng && lng!==0) || (!lat && lat!==0) || ! maxDistance) {
        console.log('locationsListByDistance missing params');
        sendJsonResponse(res, 404, {
            "message": "lng, lat and maxDistance query parameters are all required"
        });
        return;
    } else {
        Loc.aggregate(
            [{
                '$geoNear': {
                    'near': point,
                    'spherical': true,
                    'distanceField': 'dist.calculated',
                    'maxDistance': calculateDistance,
                    'num': 10
                }
            }],
        function(err, results) {
            if (err) {
                sendJsonResponse(res, 404, err);
            } else {
                if(results && results.length > 0){
                    locations = buildLocationList(req, res, results);
                    sendJsonResponse(res, 200, locations);
                }else{
                    sendJsonResponse(res, 404, {"message": "no location found"});
                }
            }
        });
    }
};

module.exports.locationsReadOne = function (req, res) {
    if (req.params && req.params.locationid) {
        Loc.findById(req.params.locationid).exec(function(err, location) {
            if(!location){
                sendJsonResponse(res, 404, {"message": "location not found"});
                return;
            }else if(err){
                sendJsonResponse(res, 400, err);
                return;
            }
            sendJsonResponse(res, 200, location);
        });
    }else{
        sendJsonResponse(res, 404, {"message": "no locationid in request"});
    }
};

module.exports.locationsCreate = function (req, res) {
    Loc.create({
        name: req.body.name,
        address: req.body.address,
        facilities: req.body.facilities.split(","),
        coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
        openingTimes: [{
            days: req.body.days1,
            opening: req.body.opening1,
            closing: req.body.closing1,
            closed: req.body.closed1
        },{
            days: req.body.days2,
            opening: req.body.opening2,
            closing: req.body.closing2,
            closed: req.body.closed2
        }]
    },function(err, location){
        if(err){
            sendJsonResponse(res, 404, err);
        }else{
            sendJsonResponse(res, 201, location);
        }
    });
};


module.exports.locationsUpdateOne = function (req, res) {
    if (!req.params.locationid) {
        sendJsonResponse(res, 404, {
            "message": "Not found, locationid is required"
        });
        return;
    }
    Loc.findById(req.params.locationid).select('-reviews -rating').exec(function(err, location) {
        if (!location) {
            sendJsonResponse(res, 404, {
                "message": "locationid not found"
            });
            return;
        } else if (err) {
            sendJsonResponse(res, 400, err);
            return;
        }
        if(req.body.name){
            location.name = req.body.name;
        }
        location.address = req.body.address;
        if(req.body.facilities){
            location.facilities = req.body.facilities.split(",");
        }
        if((req.body.lng && req.body.lng !== 0) || (req.body.lat && req.body.lat !== 0)){
            location.coords = [parseFloat(req.body.lng),parseFloat(req.body.lat)];
        }
        location.openingTimes = [{
            days: req.body.days1,
            opening: req.body.opening1,
            closing: req.body.closing1,
            closed: req.body.closed1,
        }, {
            days: req.body.days2,
            opening: req.body.opening2,
            closing: req.body.closing2,
            closed: req.body.closed2,
        }];
        location.save(function(err, location) {
            if (err) {
                sendJsonResponse(res, 404, err);
            } else {
                sendJsonResponse(res, 200, location);
            }
        });
    });
};

module.exports.locationsDeleteOne = function (req, res) {
    var locationid = req.params.locationid;
    if (locationid) {
        Loc.findByIdAndRemove(locationid).exec(function(err, location){
            if (err) {
                sendJsonResponse(res, 404, err);
                return;
            }
            sendJsonResponse(res, 204, null);
        });
    }else{
        sendJsonResponse(res, 404, {"message": "No locationid"});
    }
};