app.views.HomeView = Backbone.View.extend({

    initialize: function () {
        //TODO: don't forget app.homeView and app.loginView are both global also!... and prerendered!
        //global events
        _.bindAll(this, 'showLogin'); // "_.bindAll() changes 'this' in the named functions to always point to that object"
        _.bindAll(this, 'syncLocationChecks'); // "_.bindAll() changes 'this' in the named functions to always point to that object"
        app.eventBus.on("showLogin:home", this.showLogin); // call to execute: App.eventBus.trigger("showLogin:home");

        var self = this;
        this.model.on("reset", this.render, this);
        this.model.on("add", function (locationCategory) {
            if (self.spinner)
                self.spinner.spin(false);
            $('#gps-buttons', self.el).append(new app.views.LocationCategoryButtonView({ model: locationCategory }).render().el);
        });
    },

    onClose: function () {
        // unbind model events
        this.model.off("reset", this.render);
        this.model.off("add");
    },
    
    render: function () {
        this.$el.empty();
        this.$el.html(this.template());

        this.bindDOM();
        var self = this;
        if (this.model.models) {
            _.each(this.model.models, function (locationCategory) {
                $('#gps-buttons', self.el).append(new app.views.LocationCategoryButtonView({ model: locationCategory }).render().el);
            }, this);
        }
        else
            setTimeout(this.startSpinner, 1);
        return this;
    },

    startSpinner: function () {
        //TODO: to alter spinner size: vary the width, radius, and lines
        var opts = {
            lines: 50, // The number of lines to draw
            length: 1, // The length of each line
            width: 3, // The line thickness
            radius: 5, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            speed: .7, // Rounds per second
            trail: 90, // Afterglow percentage
            hwaccel: true, // Whether to use hardware acceleration
            opacity: '0.03',
            color: "#fff" // TODO: remove this when I put login view back
            //color: app.loginView.$el.css('color')
    };
        this.spinner = new Spinner(opts).spin();
        this.spinner.spin();
        $('#gps-buttons', this.el).append(this.spinner.el);
    },
    trackCode: function (code) {
        this.pendingTracker = {
            timestamp: Date.now(),
            position: null,
            code: code
        };
        navigator.geolocation.getCurrentPosition(this.gpsSuccess, this.gpsFailure);
    },
    // Callback accepts a Position object, which contains the
    // current GPS coordinates
    gpsSuccess: function (position) {
        app.homeView.pendingTracker.position = position;
        app.round.codes.push(app.homeView.pendingTracker);
        app.homeView.pendingTracker = null;
    },
    // Callback receives a PositionError object
    gpsFailure: function(error) {
        alert('code: ' + error.code + '\n' +
              'message: ' + error.message + '\n');
    },

    bindDOM: function () {
        // No menu needed
        //$('#side-menu-button.off', this.el).on('click', app.openMenu);
        //$('#side-menu-button.on', this.el).on('click', app.closeMenu);
    },

    events: { //local events
        "click .code": "onCodeClick",
        "click .comments": "onCommentClick",
        "click #finish-button": "onFinishClick"
    },

    showLogin: function() {
        app.slider.slidePage(app.loginView.$el);
    },
    onkeypress: function (event) {
        if (event.keyCode === 13) { // enter key pressed
            event.preventDefault();
        }
    },
    onCodeClick: function (event) {
        var $target = $(event.target);
        console.log("clicked: " + $target.val());
        this.trackCode($target.val());
    },
    onCommentClick: function (event) {
        var $target = $(event.target);
        console.log($target.parent());
        var modalCommentsView = new app.views.LocationCommentsModalView({ model: this.model.allLocations.get($target.parent().attr("id")) });
        modalCommentsView.parent = this;
        $("body").append(modalCommentsView.render().el);
        $("textarea.comments", modalCommentsView.el).focus();
    },
    onFinishClick: function(event) {
        // TODO? create an app method for this save and use promise callback approach (to handle errors/logic)?
        // use LocationCategory to save the route finish

        alert(JSON.stringify(app.round.codes));

        /*
        app.round.type.save({ endDate: new Date().toLocaleString() }, {
            patch: true, // use a patch to just send the endDate
            timeout: 8000, // 8 sec. timeout
            success: function (response) {
                console.log('round end saved');
                app.notifier.notify({
                    type: 'success',
                    message: 'Security check completed sucessfully!',
                    destroy: true // kill other notifications in case it's open from a prior failure
                })
                app.reinitialize();
                window.location = "#login";
            },
            error: function (error) {
                // TODO: do something here!
                console.log('failed to save round end: ' + error);
                app.notifier.notify({
                    type: 'error',
                    message: 'Failed to reach the server. Press finish again to retry.',
                    destroy: true // kill other notifications in case it's open from a prior failure
                })
            }
        });
        */
    },
    syncLocationChecks: function () {
        this.model.allLocations.sync("update", null, {  // to the web services! (save[patch] all every time incase we lost connection somewhere)
            success: function (response) {
                console.log('location checks saved to server ' + response);
            },
            error: function (error) {
                // TODO: do something here!
                console.log('failed to save location checks to server: ' + error);
            }
        });
    }
});

app.views.LocationListItemView = Backbone.View.extend({

    initialize: function () {
        // TODO: Need to call a function and try to sync on change
        var self = this;
        this.model.on("change", function () {
            self.render();
            self.$el.parent().scrollToTop(self.$el.offset().top, { absolute: true, ifOffScreen: true }); // scroll to the latest scan!
        }, this);
        this.model.on("destroy", this.close, this);
    },

    render: function () {
        // setElement() overrides the default this.el div element
        //this.setElement(this.template({ model: this.model.attributes }));
        // I can't use setElement because it won't re-render?
        this.$el.html(this.template({ model: this.model.attributes }));
        return this;
    }

});

app.views.LocationCommentsModalView = Backbone.Modal.extend({

    initialize: function () {
        // implement the base Modal properties
        this.cancelEl = 'a.cancel';
        this.submitEl = 'a.save';

        // we can't remder (or bind to) the view ourselves without messing up the Modal
        //this.template = this.template({ model: this.model.attributes });
        //this.model.on("change", this.render, this);
        //this.model.on("destroy", this.close, this);

        // Note: the Modal render function serializes model data to the root instead of wrapping in a "model" object -- so the template refrences attributes at the top-level
    },

    // TODO: How best to save the comment? Just write it to the location model and let the parent sync handle it?
    submit: function () {
        // TODO: test if they wrote anything
        this.model.set("comment", $('textarea.comments', this.$el).val());
        console.log("comments written to memory");
        app.homeView.syncLocationChecks();
    },
    clickOutside: function (e) {
        return false; // ignore an outside click
    }
});