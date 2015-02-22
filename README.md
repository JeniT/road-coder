# Road Coder

This application is designed to enable people to submit addresses to Open Addresses while walking along roads.

## Installation

To run this locally, clone this repo and change directory into the `road-coder` directory.

Then, as this is a [Meteor](https://meteor.com) application, you need to install Meteor:

    $ curl https://install.meteor.com | /bin/sh

To submit addresses to [Ernest](http://ernest.openaddressesuk.org), you need to configure the application to know where to send them. For development, use the Ernest sandbox. Create a file at `.config/development/settings.json` that looks like:

    {
      "ERNEST_URL": "http://ernest-sandbox.herokuapp.com/addresses",
      "ERNEST_API_KEY": "YOUR_ERNEST_API_KEY"
    }

You can get an Ernest API key by emailing [info@openaddressesuk.org](mailto:info@openaddressesuk.org).

When you're ready to submit into the live service, change from the sandbox URL from `http://ernest-sandbox.herokuapp.com/addresses` to `http://ernest.openaddressesuk.org/addresses`.

## TODO

It would be great to have some help on this application, most particularly to provide better User Experience.

## Licence

Copyright (c) 2015 Jeni Tennison

This software is available under an [MIT Licence](http://opensource.org/licenses/MIT).
