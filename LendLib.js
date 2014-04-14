lists = new Meteor.Collection('Lists');

/* Checks to see if the current user making the request to update is the admin user */

function isAdminUser(userId) {
	var adminUser = Meteor.users.findOne({username:'admin'})
	return userId && adminUser && userId === adminUser._id
}

function isOwner(userId, doc) {
	return userId && doc.owner === userId
}

lists.allow ({
	insert: function(userId, doc) {
		return isOwner(userId, doc)
	},
	update: function(userId, doc, fields, modifier) {
		return isOwner(userId, doc)
	},
	remove: function(userId, doc) {
		return isOwner(userId, doc)
	}
})

