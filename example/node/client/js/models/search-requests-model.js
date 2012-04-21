define( [
	'backbone',
	'bus'
],
	function ( Backbone, bus ) {
		"use strict";

		return Backbone.Model.extend( {
			defaults : {
				requests : [],
				ownerId : undefined,
				sessionId : undefined
			},

			initialize : function () {
				_.bindAll( this );
				this.setSessionId();
				this.subscriptions = [
					bus.app.subscribe( "search.info", this.setOwner ),
					bus.app.subscribe( "search.requests", this.updateRequests ),
					bus.app.subscribe( "search.new.ask", this.addRequest ),
					bus.app.subscribe( "search.init", function () {
						self.set( "requests", [] );
					} )
				];
				this.askForUpdate();
			},

			askForUpdate : function () {
				bus.app.publish( {
					topic : "get.search.requests",
					data : {}
				} );
				bus.app.publish( {
					topic : "get.search.info",
					data : {}
				} );
			},

			dispose : function () {
				_.each( this.subscriptions, function ( subscription ) {
					subscription.unsubscribe();
				} );
				this.clear( { silent : true } );
			},

			setOwner : function ( data, env ) {
				this.set( "ownerId", data.id );
				this.change();
				this.setSessionId();
			},

			setSessionId : function () {
				var self = this;
				postal.utils.getSessionId(
					function ( session ) {
						self.set( "sessionId", session.id );
						self.change();
					}
				);
			},

			updateRequests : function ( data, env ) {
				console.log( "Got an update" );
				this.set( "requests", _.sortBy( data, function ( item ) {
					return item.searchTerm;
				} ) );
				this.change();
			},

			addRequest : function ( data, env ) {
				var reqs = this.get( "requests" );
				if ( _.any( reqs, function ( item ) {
					return item.searchTerm === data.searchTerm &&
					       item.correlationId === data.correlationId
				} ) ) {
					return;
				}
				reqs.push( data );
				this.set( "requests", _.sortBy( reqs, function ( item ) {
					return item.searchTerm;
				} ) );
				this.change();
			}
		} );
	} );