
function Loci () {

    this.sboxObj = null;
    this.positionFixNumber = 0; // the number of attempts its made to get a position fix
    this.startTimestamp = null;
    this.requestSent = false;
    this.maxtime = 10000; // maximum time in miliseconds to look for a location (send best location after this time).
    this.url = '/test'; // the url to send the post request to.
    this.accuracyThreshold = 23; // the accuracy threshold (sends information to signalbox when position is better than this).
    // note for Google Chrome mobile it seems that we need to have this below 10 to force GPS and force update.
    //TODO could have a minimum allowed time instead of setting a low accuracy threshold. This might do the same job
    // force GPS and update
    this.watchId = null;
    this.options = {
    enableHighAccuracy: true, //location accuracy (should be set to true).
    maximumAge: 1000, // the maximum age (in milliseconds) allowed to use an old location (rather than try and get a new one).
    timeout: 20000  // The timeout attribute denotes the maximum length of time (expressed in milliseconds) that is allowed
    // to pass from the first call
    };

        /*
    *  get current location, used to quickly return a location (even if it is low accuracy and lacks direction information)
    */
    this.getCurrentLocation = function(){

        var self = this;

        var geolocationSupported = ("geolocation" in navigator);

        if (geolocationSupported) {
            console.log('geolocation is supported')
            this.watchId = navigator.geolocation.getCurrentPosition(
                function(position){self.onLocationSuccess.call(self, position)},
                this.onError, this.options);

        } else {
            console.log('geolocation is not supported');
            alert('geolocation is not supported')
        }

    };

    /*
    * on location success
    */
    this.onLocationSuccess = function(position){
        this.sboxObj = this.positionToSignalbox(position);
        this.sendRequestToSignalbox.call(this.self, this.url, this.sboxObj);
    };


    /*
     *  The watch position object is called to obtain a new location.
     */
    this.watchPosition = function() {

        var self = this;

        var geolocationSupported = ("geolocation" in navigator);

        if (geolocationSupported) {
            console.log('geolocation is supported')
            this.watchId = navigator.geolocation.watchPosition(
                function(position){self.onWatchSuccess.call(self, position)},
                this.onError, this.options);
                //we have to use bind on the following function (setTimeout) to use the correct context.
                // see https://javascript.info/bind
                setTimeout(this.onMaximumTime.bind(this), this.maxtime); //runs this function after maxtime has elapsed
        } else {
            console.log('geolocation is not supported');
            alert('geolocation is not supported')
        }
    };


     /**
    * creates signalbox object.
    */
    this.positionToSignalbox = function(position){
        let pos = {};
        pos.lat = position.coords.latitude;
        pos.lon = position.coords.longitude;
        pos.accuracy = position.coords.accuracy;

        if (position.coords.altitude) {
           pos.altitude = position.coords.altitude;
            }

        if (position.coords.speed){
            pos.speed = position.coords.speed;
            pos.bearing = position.coords.heading;
        }
        return pos;
    };

    /*
    * called when
     */
    this.onWatchSuccess = function(position){

        //output position results to console
        console.log('found location with coordinates: ');
        console.log(position.coords);

        if (position.coords.speed){
            console.log('speed: ');
            console.log(position.coords.speed);
            console.log('bearing: ');
            console.log(position.coords.heading);
        }

        this.sboxObj = this.positionToSignalbox(position);
        this.positionFixNumber = this.positionFixNumber + 1;
        var elapsedTime = Math.floor(Date.now() / 1000) - this.startTimestamp;

//        document.getElementById("positionResult").innerHTML = position.timestamp + " " + this.positionFixNumber
//            + " " + JSON.stringify(this.sboxObj) +
//        " elapsed time: " + elapsedTime +"s";

        console.log('position accuracy: ')
        console.log(position.coords.accuracy)

        // if manages to find an accurate GPS fix (i.e. a location with speed) then exits early.
        if(position.coords.accuracy < this.accuracyThreshold && position.coords.speed){
            //clear watch
            console.log('accuracy below threshold')
            navigator.geolocation.clearWatch(this.watchId);
            this.requestSent = true;
            this.sendRequestToSignalbox.call(this.self, this.url, this.sboxObj);
        }
    };

    this.onError = function(error) {
          switch(error.code) {
            case error.PERMISSION_DENIED:
              alert("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              alert("Location information is unavailable.");
              break;
            case error.TIMEOUT:
               alert("The request to get user location timed out.");
              break;
            case error.UNKNOWN_ERROR:
              alert("An unknown error occurred.");
              break;
          }
    };

    /**
     * The maximum time.
     */
    this.onMaximumTime = function(){
        // always clear watch as we done listening
        navigator.geolocation.clearWatch(this.watchId);

        //only send a position request if one hasn't been sent already.
        if(!this.requestSent){
            this.sendRequestToSignalbox.call(this.self, this.url, this.sboxObj);
        }else{
        //location can't be found.
        }
    };

    /**
    * This function sends the request to the given url (it uses the form method).
    */
    this.sendRequestToSignalbox = function(path, params, method) {

         method = method || "post"; // Set method to post by default if not specified.

        // The rest of this code assumes you are not using a library.
        // It can be made less wordy if you use one.

        var form = document.createElement("form");
        form.setAttribute("method", method);
        form.setAttribute("action", path);

        for(var key in params) {
            if(params.hasOwnProperty(key)) {
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", params[key]);
                form.appendChild(hiddenField);
            }
        }
        document.body.appendChild(form);
        form.submit();
    };




}


