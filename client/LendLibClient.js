Meteor.subscribe('Categories')

Meteor.autosubscribe(function() {
	Meteor.subscribe('listdetails', Session.get('current_list'))
})

//// Generic Helper Functions \\\\
// This function puts our cursor where it needs to be. Importantly, it fills in the value of
// the textbox, or else an existing value (e.g. when you're updating) will seem to have
// disappeared or not available for editing.
function focusText (i, val) {
	i.focus()
	i.value = val ? val : ''
	i.select()
}

function selectCategory (e,t) {
	if (this._id)
		console.log(this._id)
	Session.set('current_list', this._id)
}

Template.categories.lists = function () {
	return lists.find({}, {sort: {Category:1}})
};
Template.categories.list_status = function () {
	if (Session.equals('current_list', this._id))		/* "this" is the MongoDB document cursor. It's the "context". */
		return ' btn-info';
	else
		return ' btn-primary';
}
Template.categories.new_cat = function () {
	return Session.equals('adding_category', true);
}
Template.categories.events({
	'click #btnDelCat': function (e,t) {
		var cats = lists.findOne({_id:Session.get('current_list')});
		if (cats) {
			lists.remove({_id:cats._id});
			Session.set('current_list', null);
		}
	},
	'click #btnNewCat': function (e,t) {		/* When the + button is clicked, this will override */
		Session.set('adding_category', true)	/* the click.category event because of the Meteor.flush. */
		Meteor.flush()
		focusText( t.find('#add-category') )
	},
	'keyup #add-category': function (e,t) {
		if (e.which === 13) {
			var catVal = String( e.target.value || '' )
			if (catVal) {
				var _id = lists.insert({Category:catVal, owner:Meteor.userId()})
				Session.set('adding_category', false)
				Session.set('current_list', _id);
			}
		}
	},
	'focusout #add-category': function (e,t) {
		Session.set('adding_category', false)
	},
	'click .category': selectCategory
},
[Session.set('adding_category', false)]		/* We are declaring the 'adding category' flag */
);

function addItem (list_id, item_name) {
	if (!item_name && !list_id)
		return;
	lists.update({_id:list_id}, {$addToSet:{items:{Name:item_name}}});
}

function removeItem (list_id, item_name) {
	if (!list_id || !item_name)
		return;
	lists.update({_id:list_id}, {$pull:{items:{Name:item_name}}});
}

function updateLendee (list_id, item_name, lendee_name) {
	var l = lists.findOne({"_id":list_id , "items.Name":item_name}); /* This is a two-level query. */
		if (l && l.items) {
			for (var i = 0; i<l.items.length; i++) { /* We actually allow entering an item more than once */
				if (l.items[i].Name === item_name) {	 /* which is strange. And so when we have to update "it", */
					l.items[i].LentTo = lendee_name;		 /* we have to update all of them. */
				}
			}
			lists.update({"_id":list_id},{$set:{"items":l.items}});
		}
};

Template.list.items = function () {
	if (Session.equals('current_list', null))
		return null;
	else {
		var cats = lists.findOne({_id:Session.get('current_list')});
		if (cats && cats.items) {
			for (var i=0; i < cats.items.length ;++i) {
				var d = cats.items[i];
				d.Lendee = d.LentTo ? d.LentTo : 'free';
				d.LendClass = d.LentTo ? 'label-warning' : 'label-success';
			}
			return cats.items;
		}
	}
	Template.list.list_selected = function () {
		return ((Session.get('current_list')!=null) && (!Session.equals('current_list',null)));
	}
	Template.list.list_status = function () {
		if (Session.equals('current_list', this._id))
			return ' btn-info';
		else
			return ' btn-primary';
	}
	Template.list.list_adding = function () {
		return (Session.equals('list_adding', true));
	}
	Template.list.lendee_editing = function () {
		return (Session.equals('lendee_input', this.Name));
	}
};

Template.list.events({
	'click #btnAddItem': function (e,t) {
		Session.set('list_adding',true);
		Meteor.flush();
		focusText( t.find("#item_to_add") );
	},
	'keyup #item_to_add': function (e,t) {
		if (e.which === 13) {
			addItem(Session.get('current_list'), e.target.value);
			Session.set('list_adding', false);
		}
	},
	'focusout #item_to_add': function (e,t) {
		Session.set('list_adding', false);
	},
	'click .delete_item': function (e,t) {
		removeItem(Session.get('current_list'), e.target.id);
	},
	'click #lendee': function (e,t) {
		Session.set('lendee_input', this.Name);
		Meteor.flush();	/* Without this, the next line of code will seem to fail. When the view renders it, it will be reset and the next line's action will be nullified. */
		focusText( t.find("#edit_lendee"), this.LentTo);	/* Without this, the input textbox that will be shown will not have the lendee's name in it. */
	},
	'focusout #edit_lendee': function (e,t) {
		Session.set('lendee_input', false);
	},
	'keyup #edit_lendee': function (e,t) {
		if (e.which === 13) {
			updateLendee( Session.get('current_list'), this.Name, e.target.value);
			Session.set('lendee_input', null);
		}
		if (e.which === 27) {
			Session.set('lendee_input', null);
		}
	}
});

Accounts.ui.config({
	passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
})

