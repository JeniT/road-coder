Addresses = new Mongo.Collection("addresses");

if (Meteor.isClient) {

  Meteor.startup(function() {
    Meteor.typeahead.inject();
  });

  var addressform;

  Template.addressform.created = function() {
    addressform = this;
    Session.set('town', "");
    Session.set('street', "");
    Session.set('increment', "up");
    Session.set('incrementBy', 2);
  };

  var incrementNumber = function() {
    var numberInput = addressform.find('#number');
    var number = parseFloat(numberInput.value);
    if (isNaN(number)) {
      numberInput.value = "";
    } else {
      if (Session.get('increment') === "up") {
        numberInput.value = number + Session.get('incrementBy');
      } else {
        numberInput.value = number - Session.get('incrementBy');
      }
    }
  };

  Template.addressform.helpers({
    noCurrentUser: function() {
      return Meteor.user() === null;
    },
    townEmpty: function() {
      return Session.get('town') === "";
    },
    streetEmpty: function() {
      return Session.get('street') === "";
    },
    townSearch: function(query, callback) {
      Session.set('town', query);
      if (query.length >= 2) {
        var searchUrl = 'https://alpha.openaddressesuk.org/localities.json?q=' + query;
        var searchRequest = $.get(searchUrl);
        searchRequest.done(function (data) {
          var results = [];
          $.each(data.localities, function(index, value) {
            var v = value.locality.name.en[0];
            if ($.inArray(v, results) === -1) {
              results.push(v);
            }
          });
          callback(results.map(function(v) { return { value: v }; }));
        });
        searchRequest.error(function () {
          callback([]);
        });
      } else {
        callback([]);
      }
    },
    townSelected: function() {
      if (addressform) {
        addressform.find('#street').focus();
      }
    },
    streetSearch: function(query, callback) {
      Session.set('street', query);
      if (query.length >= 5) {
        var searchUrl = 'https://alpha.openaddressesuk.org/addresses.json?';
        searchUrl += 'town=' + addressform.find('#town').value;
        if (addressform.find('#street')) {
          searchUrl += '&street=' + addressform.find('#street').value;
        }
        var oaSearch = $.get(searchUrl);
        oaSearch.done(function (data) {
          var results = [];
          $.each(data.addresses, function(index, value) {
            var v = value.street.name.en[0];
            if ($.inArray(v, results) === -1) {
              results.push(v);
            }
          });
          callback(results.map(function(v) { return { value: v }; }));
        });
        oaSearch.error(function () {
          callback([]);
        });
      } else {
        callback([]);
      }
    },
    streetSelected: function() {
      if (addressform) {
        addressform.find('#number').focus();
      }
    },
    increment: function() {
      return Session.get('increment');
    },
    incrementBy: function() {
      return Session.get('incrementBy');
    }
  });

  Template.addressform.events({
    "change #change": function(event) {
      Session.set('increment', event.target.value === "increment" ? 'up' : 'down');
    },
    "change #changeBy": function(event) {
      Session.set('incrementBy', parseInt(event.target.value));
    },
    "click #skip": function(event) {
      incrementNumber();
      return false;
    },
    "submit form": function(event) {
      try {
        var form = event.target;
        var address = {
          number: form.number.value,
          street: form.street.value,
          town: form.town.value,
        };
        var latLng = Geolocation.latLng();
        if (latLng) {
          address.lat = latLng.lat;
          address.lng = latLng.lng;
        }
        Meteor.call('addAddress', address);
        incrementNumber();
        return false;
      } catch (e) {
        console.log(e);
        return false;
      }
    }
  });

  Template.addresses.helpers({
    addresses: function() {
      return Addresses.find({}, { limit: 5, sort: { timestamp: -1 }});
    }
  });

  Template.address.helpers({
    lat: function() {
      if (this.geo) {
        return this.geo.latitude.toLocaleString();
      } else {
        return null;
      }
    },
    lng: function() {
      if (this.geo) {
        return this.geo.longitude.toLocaleString();
      } else {
        return null;
      }
    },
    dateTime: function() {
      return moment(this.timestamp).from(new Date());
    },
    user: function() {
      var user = Meteor.users.findOne({_id: this.userId});
      if (user) {
        return user.username;
      } else {
        return null;
      }
    }
  });

  // At the bottom of the client code
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.methods({
    addAddress: function(address) {
      if (! Meteor.userId()) {
        throw new Meteor.Error("not-authorized");
      }
      var addressData = {
        timestamp: new Date(),
        userId: Meteor.userId(),
        number: address.number,
        street: address.street,
        town: address.town
      };
      if (address.lat) {
        addressData.geo = {
          latitude: address.lat,
          longitude: address.lng
        }
      }
      if (addressData.number !== "" && addressData.street !== "" && addressData.town !== "") {
        Addresses.insert(addressData);
        var ernestData = {
          "addresses": [{
            "address": { 
              "paon": { "name": addressData.number },
              "street": { "name": addressData.street }
            },
            "provenance": {
              "executed_at": addressData.timestamp.toISOString(),
              "url": "http://road-coder.meteor.com"
            }
          }]
        };
        if (addressData.geo) {
          ernestData.addresses[0].address.paon.geometry = {
            "type": "Point",
            "coordinates": [ addressData.geo.longitude, addressData.geo.latitude ]
          }
        }
        var searchUrl = 'https://alpha.openaddressesuk.org/towns.json?q=' + addressData.town;
        var searchRequest = HTTP.get(searchUrl, {}, function (error, result) {
          if (result.data.towns.length > 0) {
            ernestData.addresses[0].address.town = { "name": addressData.town };
          } else {
            ernestData.addresses[0].address.locality = { "name": addressData.town };
          }
          console.log(JSON.stringify(ernestData));
        });
      }
    }
  });
}
