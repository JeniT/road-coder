Addresses = new Mongo.Collection("addresses");

if (Meteor.isClient) {

  Meteor.startup(function() {
    Meteor.typeahead.inject();
  });

  var addressform;

  Template.addressform.created = function() {
    addressform = this;
  };

  var search = function(what, query, callback) {
    var searchUrl = 'https://alpha.openaddressesuk.org/addresses.json?';
    searchUrl += 'street=' + addressform.find('#street').value;
    searchUrl += '&town=' + addressform.find('#town').value;
    var oaSearch = $.get(searchUrl);
    oaSearch.done(function (data) {
      var results = [];
      $.each(data.addresses, function(index, value) {
        var v = value[what].name.en[0];
        if ($.inArray(v, results) === -1) {
          results.push(v);
        }
      });
      callback(results.map(function(v) { return { value: v }; }));
    });
    oaSearch.error(function () {
      callback([]);
    });
  };

  Template.addressform.helpers({
    townSearch: function(query, callback) {
      search('town', query, callback);
    },
    streetSearch: function(query, callback) {
      if (query.length > 5) {
        search('street', query, callback);
      } else {
        callback([]);
      }
    }
  });

  Template.addressform.events({
    "submit #addressform": function(event) {
      try {
        var form = event.target;
        var address = {
          timestamp: new Date(),
          userId: Meteor.userId(),
          number: form.number.value,
          street: form.street.value,
          town: form.town.value,
        };
        var latLng = Geolocation.latLng();
        if (latLng) {
          address.geo = {
            latitude: latLng.lat,
            longitude: latLng.lng
          }
        }
        if (address.number !== "" && address.street !== "" && address.town !== "") {
          Addresses.insert(address);
          form.number.value = "";
        }
        return false;
      } catch (e) {
        console.log(e);
        return false;
      }
    }
  });

  Template.addresses.helpers({
    addresses: function() {
      return Addresses.find({});
    }
  });

  Template.address.helpers({
    dateTime: function() {
      return this.timestamp.toLocaleString();
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
}
