/*
IMPORTANT - done
*/

/*
Highly Desireable
*/
// TODO: Go through all my TODOs (add to GitHub?)
// TODO: Session expiration (client)
// TODO: Manual login (or at least remove it)
// TODO: NFC write
// TODO: Handle failed API calls to allow retry/logoff (loading location list)

/*
NOT important
*/
// TODO: Session expiration (server)
// TODO: Fix models
// TODO: More polish (maybe a splash)
// TODO: Kiosk mode (tablet)
// TODO: Tear out unused (sample) code
// TODO: Don't scroll *too much* (locations list -- only off-screen -- not when off screen )

var config = {};
config.api_url = "https://probation-dev.co.ventura.ca.us/api/";
config.userInfo_api_url = config.api_url + "Account/UserInfo";
config.locationsCodeTable = "WFLOC";

var app = {
    config: config,
    views: {},
    models: {},
    routers: {},
    utils: {},
    adapters: {},
    currentPage: null,
    round: {
        type: {},
        locations: {},
        codes: []
    },
    user: {
        session: null,
        auth: null,
        userTagMessage: null
    },
    writeNfc: false, // TODO: DON'T DO THIS!
	initialize: function () {
	    //app.clearScreen();
	    app.slider = new PageSlider($('body'));
        app.bindDevice();
        app.compileTemplates();
		app.addTemplateHelpers();
		//app.showInstructions("Starting. Please wait...");
	},
	reinitialize: function () { // clear all session-specific data so the app can be reused (should be headed to the login screen)
	    if (app.homeView) {
	        app.homeView.close();
	        delete app.homeView;
	    }
	    if (app.loginView) {
	        app.loginView.close();
	        delete app.loginView;
	    }
	    delete app.user.session;
	    delete app.user.auth;
	    delete app.user.userTagMessage;
	    delete app.currentPage;
	    delete app.round.type;
	    delete app.round.locations;
	    delete app.writeNfc;
	    //window.location = "#login";
	    //location.reload();
	    //navigator.app.loadUrl('file:///android_asset/www/index.html');
	},
	eventBus: _.extend({}, Backbone.Events),
    // call the notifier like this: app.notifier.notify({message:'Hello notifier!',type:'error'});
	notifier: new Backbone.Notifier({	
	    el: 'body', 	// container for notification (default: 'body')
	    //baseCls: 'notifier',// css classes prefix, should match css file. Change to solve conflicts.
	    theme: 'dark',// default theme for notifications (available: 'plastic'/'clean').
	    //types: ['warning', 'error', 'info', 'success'],// available notification styles
	    type: null, 	// default notification type (null/'warning'/'error'/'info'/'success')
	    dialog: false,	// whether display the notification with a title bar and a dialog style.
	    modal: false,	// whether to dark and block the UI behind the notification (default: false)
	    title: undefined,// default notification title, if defined, causes the notification to be 'dialog' (unless dialog is 'false')
	    closeBtn: false, // whether to display an enabled close button on notification
	    ms: 10000,	// milliseconds before hiding (null || false => no timeout) (default: 10000)
	    'class': null, // additional css class
	    hideOnClick: true,// whether to hide the notifications on mouse click (default: true)
	    loader: false,	// whether to display loader animation in notifications (default: false)
	    destroy: false,// notification or selector of notifications to hide on show (default: false)
	    opacity: .9,	// notification's opacity (default: 1)
	    offsetY: 0,	// distance between the notifications and the top/bottom edge (default: 0)
	    fadeInMs: 500,	// duration (milliseconds) of notification's fade-in effect (default: 500)
	    fadeOutMs: 500,	// duration (milliseconds) of notification's fade-out effect (default: 500)
	    position: 'bottom',// default notifications position ('top' / 'center' / 'bottom')
	    zIndex: 10000,	// minimal z-index for notifications
	    screenOpacity: 0.5// opacity of dark screen background that goes behind for modals (0 to 1)
	}),
	openMenu: function () {
		$('#right').animate({ translate3d:'260px,0,0' }, 200);
		//$('#right').animate({ left: 250 }, 350);
		$('#side-menu-button.off').addClass("on");
		$('#side-menu-button.off').removeClass("off");
		$('#side-menu-button.on').on('click', app.closeMenu);
		document.removeEventListener("menubutton", app.openMenu, false);
		document.addEventListener("menubutton", app.closeMenu, false);
		document.addEventListener("backbutton", app.closeMenu, false);
	},
	closeMenu: function () {
		$('#right').animate({ translate3d:'0,0,0' }, 200);
		//$('#right').animate({ left: 0 }, 300);
		$('#side-menu-button.on').addClass("off");
		$('#side-menu-button.on').removeClass("on");
		$('#side-menu-button.off').on('click', app.openMenu);
		document.removeEventListener("menubutton", app.closeMenu, false);
		document.removeEventListener("backbutton", app.closeMenu, false);
		document.addEventListener("menubutton", app.openMenu, false);
	},
	setAccessToken: function (accessToken) {
		localStorage["accessToken"] = accessToken;
	},
	getAccessToken: function (accessToken) {
		return localStorage["accessToken"];
	},
	clearAccessToken: function () {
		localStorage.removeItem("accessToken");
	},
	getSecurityHeaders: function () {
		var accessToken = app.getAccessToken();
		if (accessToken) {
			return { "Authorization": "Bearer " + accessToken };
		}
		return {};
	},
	getUserInfo: function () {
		console.log("Getting user data");
		var userInfoUrl = config.userInfo_api_url;
		var headers = app.getSecurityHeaders();
		return $.ajax({
			url: userInfoUrl,
			cache: false,
			headers: headers
		});
	},
	getLocations: function () {
	    console.log("Getting possible locations on route");
	    var userInfoUrl = app.config.api_url + "Account/UserInfo";
	    var headers = app.getSecurityHeaders();
	    return $.ajax({
	        url: userInfoUrl,
	        cache: false,
	        headers: headers
	    });
	},
	bindDevice: function () {
	    document.addEventListener('deviceready', this.deviceready, false);
	},
	deviceready: function () {
        // no menu for now
        //document.addEventListener("menubutton", app.openMenu, false);
        document.addEventListener("menubutton", function (e) { e.stopImmediatePropagation(); }, false);
        document.addEventListener("backbutton", function (e) { e.stopImmediatePropagation(); }, false);
        function failure(reason) {
            navigator.notification.alert(reason, function() {}, "There was a problem");
        }
        app.runLogic();
    },
    compileTemplates: function () {
        app.router = new app.routers.AppRouter();
        app.utils.templates.load(["HomeView", "LoginView", "LoginFormView", "LocationCategoryButtonView", "LocationListItemView", "LocationCommentsModalView"],
            function () {
                app.router = new app.routers.AppRouter();
                Backbone.history.start();
            });

        //template = Handlebars.getTemplate("InstructionsDivView");
        //app.instructionsTemplate = Handlebars.compile(template);

        //template = document.getElementById('tag-template').innerHTML;
        //app.tagTemplate = Handlebars.compile(template);
        //template = document.getElementById('tag-list-template').innerHTML;
        //app.tagListTemplate = Handlebars.compile(template);
        //template = document.getElementById('tag-status-template').innerHTML;
        //app.tagStatusTemplate = Handlebars.compile(template);
    },
    addTemplateHelpers: function () {
        Handlebars.registerHelper('formatTime', function (date) {
            return new Date(date).toTimeString().substring(0,5);
        });
        // useful for boolean
        Handlebars.registerHelper('toString', function(value) {
            return String(value);
        });
        Handlebars.registerHelper('exclamation', function(record) {
			var exclamations = [
				'Awesome!',
				'Great!',
				'Ok.',
				'Fantastic!'];
            return exclamations[Math.floor(Math.random() * exclamations.length)];
        });
        Handlebars.registerHelper('pluralize', function(number, single, plural) {
          if (number === 1) { return single; }
          else { return plural; }
        });
    }
};

function testStart() {
    app.deviceready();
}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;
    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }
    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }
    return JSON.parse(JSON.stringify(a));
}