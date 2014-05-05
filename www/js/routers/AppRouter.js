// TODO? Put framework extensions somewhere else? in app?
Backbone.View.prototype.close = function () {
    //COMPLETELY UNBIND THE VIEW
    this.undelegateEvents();
    //if (this.$el)
    //    this.$el.removeData().unbind();
    this.unbind();
    if (this.onClose) {
        this.onClose();
    }

    //Remove view from DOM
    this.remove();
    //Backbone.View.prototype.remove.call(this);

    // destroy the model
    if (this.model) {
        if (this.model.reset)
            this.model.reset();
        if (this.model.destroy)
            this.model.destroy();
    }
    //delete this.model;
}

app.routers.AppRouter = Backbone.Router.extend({
    routes: {
        "":                         "home",
        "login":                    "login", // TODO? how can I use this?
        "manualLogin":              "manualLogin",
        "employees/:id":            "employeeDetails",
        "employees/:id/reports":    "reports"/*,
        "employees/:id/map":        "map"
        #removed ^
        */
    },

    initialize: function () {
        // Doing this here seems to break things?
        //app.initialize();
    },

    // controller functions
    home: function () {
        // TODO? how do we identify that the user didn't get here deliberately? (i.e. from a user tag scan with app closed)

        // TODO! put this code back!
        //if (app.user.auth == null) {
        if (app.user.auth != null) { // temporarily bypass the login
            // goto login
            window.location = "#login";
        } else {
            // load the home view
            app.currentPage = "home";
            console.log("current page: " + app.currentPage);

            // The home view never changes, so we instantiate and render it only once
            if (!app.homeView) {
                // TODO: I may need to put this fetch back
                /*
                app.round.type.allLocations.fetch({
                    error: function (error) {
                        // TODO: error handling
                        console.log(error);
                        console.log("Location API call failed: " + error);
                    }
                });
                */
                var model = new app.models.LocationCategoryCollection([
                { "name": "Code 1", "id": 1 },
                { "name": "Code 2", "id": 2 },
                { "name": "Code 3", "id": 3 },
                { "name": "Code 4", "id": 4 }
            ]);
                app.homeView = new app.views.HomeView({ model: model });
                app.homeView.render();

                //app.homeView = new app.views.HomeView();
                //app.homeView.render();
            } else {
                console.log('reusing home view');
                app.homeView.delegateEvents(); // delegate events when the view is recycled
            }

            // TODO? ditch pageslider? it seems to just overlap contents
            app.slider.slidePage(app.homeView.$el);
        }
    },

    login: function () {
        app.currentPage = "login";
        console.log("current page: " + app.currentPage);

        // logoff
        app.user.auth = null;
        app.user.session = null;

        // The login view never changes, so we instantiate and render it only once
        if (!app.loginView) {
            app.loginView = new app.views.LoginView();
            app.loginView.render(); //TODO? Should we render the login view just because we visit home?
        } else {
            console.log('reusing login view');
            app.loginView.delegateEvents(); // delegate events when the view is recycled
        }

        // load the login view
        app.slider.slidePage(app.loginView.$el);
    },

    manualLogin: function () {
        app.currentPage = "manualLogin";
        console.log("current page: " + app.currentPage);

        alert('manualLogin not implemented');
        window.location = "#login";
    },

    employeeDetails: function (id) {
        var employee = new app.models.Employee({id: id});
        employee.fetch({
            success: function (data) {
                // Note that we could also 'recycle' the same instance of EmployeeView
                // instead of creating new instances
                app.slider.slidePage(new app.views.EmployeeView({model: data}).render().$el);
            }
        });
    },

    reports: function (id) {
        var employee = new app.models.Employee({id: id});
        employee.fetch({
            success: function (data) {
                // Note that we could also 'recycle' the same instance of ReportsView
                // instead of creating new instances
                app.slider.slidePage(new app.views.ReportsView({model: data}).render().$el);
            }
        });
    }/*,

    map: function (id) {
        app.slider.slidePage(new app.views.MapView().render().$el);
    }
    #removed ^
    */

});