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

  var search = function(what, query, callback) {
    var searchUrl = 'https://alpha.openaddressesuk.org/addresses.json?';
    searchUrl += 'town=' + addressform.find('#town').value;
    if (addressform.find('#street')) {
      searchUrl += '&street=' + addressform.find('#street').value;
    }
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
      search('town', query, callback);
    },
    streetSearch: function(query, callback) {
      Session.set('street', query);
      if (query.length >= 5) {
        search('street', query, callback);
      } else {
        callback([]);
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
          var number = parseFloat(form.number.value);
          if (isNaN(number)) {
            form.number.value = "";
          } else {
            if (Session.get('increment') === "up") {
              form.number.value = number + Session.get('incrementBy');
            } else {
              form.number.value = number - Session.get('incrementBy');
            }
          }
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
}
