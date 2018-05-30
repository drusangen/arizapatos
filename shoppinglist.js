var db = new PouchDB('shopping');
// Vue Material plugin
Vue.use(VueMaterial);

const sampleShoppingList = {
  "_id": "",
  "type": "list",
  "version": 1,
  "title": "",
  "createdAt": "",
  "updatedAt": ""
};

const sampleListItem = {
  "_id": "list:cj6mj1zfj000001n1ugjfkj33:item:cj6mn7e36000001p9n14fgk6s",
  "type": "item",
  "version": 1,
  "deuda": 0,
  "pago": 0,
  "createdAt": "",
  "updatedAt": ""
};

// Vue Material theme
Vue.material.registerTheme('default', {
  primary: 'blue',
  accent: 'white',
  warn: 'red',
  background: 'grey'
});

var app = new Vue({
  el: '#app',
  data: {
    pagetitle: 'Venta de Zapatos',
    shoppingLists: [],
    shoppingListItems: [],
    mode: 'showlist',
    singleList: null,
    currentListId: null,
    monto: '',
  },
  created: function() {

    // create database index on the 'type' field
    db.createIndex({ index: { fields: ['type'] }}).then(() => {
      
      // load all 'list' items 
      var q = {
        selector: {
          type: 'list'
        }
      };
      return db.find(q);
    }).then((data) => {

      // write the data to the Vue model, and from there the web page
      app.shoppingLists = data.docs;

      // get all of the shopping list items
      var q = {
        selector: {
          type: 'item'
        }
      };
      return db.find(q);
    }).then((data) => {
      app.shoppingListItems = data.docs;
    });
  },
  computed: {
    deudaPendiente: function() {
      // calculate the counts of items and which items are checked,
      // grouped by shopping list
      var obj = {};
      // count #items and how many are checked
      for(var i in this.shoppingListItems) {
        var d = this.shoppingListItems[i];
        if (!obj[d.list]) {
          obj[d.list] = { deuda:0, pago:0, pendiente: 0};
        }
        obj[d.list].deuda += parseFloat(d.deuda);
        obj[d.list].pago += parseFloat(d.pago);
        obj[d.list].pendiente =  obj[d.list].deuda - obj[d.list].pago;
      }
      return obj;
    }

  },
  methods: {
    onClickAddShoppingList: function() {
      // open shopping list form
      this.pagetitle = 'Nueva Cliente';
      this.mode='addlist';
      this.singleList = JSON.parse(JSON.stringify(sampleShoppingList));
      this.singleList._id = 'list:' + cuid();
      this.singleList.createdAt = new Date().toISOString();
    },
    onBack: function() {
      this.mode='showlist';
      this.pagetitle='Venta de Zapatos';
    },
    onClickSaveShoppingList: function() {
      this.singleList.updatedAt = new Date().toISOString();
      this.shoppingLists.unshift(this.singleList);
       // write to database
       db.put(this.singleList).then((data) => {
          this.singleList._rev = data.rev;
          this.onBack();
        });
    },
    onClickList: function(id, title) {
      this.currentListId = id;
      this.pagetitle = title;
      this.mode = 'itemedit';
    },
    onAddListItemDeuda: function() {
      var obj = JSON.parse(JSON.stringify(sampleListItem));
      obj._id = 'item:' + cuid();
      obj.deuda = this.monto;
      obj.list = this.currentListId;
      obj.createdAt = new Date().toISOString();
      obj.updatedAt = new Date().toISOString();
      db.put(obj).then( (data) => {
        obj._rev = data.rev;this.shoppingListItems.push(obj);
        this.monto = '';
      });
    },
    onAddListItemPago: function() {
      var obj = JSON.parse(JSON.stringify(sampleListItem));
      obj._id = 'item:' + cuid();
      obj.pago = this.monto;
      obj.list = this.currentListId;
      obj.createdAt = new Date().toISOString();
      obj.updatedAt = new Date().toISOString();
      db.put(obj).then( (data) => {
        obj._rev = data.rev;this.shoppingListItems.push(obj);
        this.monto = '';
      });
    },
    parseIsoDatetime: function(dtstr) {
      mes=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
      var dt = dtstr.split(/[: T-]/).map(parseFloat);
      var dt2 = [dt[2],mes[dt[1]-1],dt[0]]
      return dt2.join("-");
    },
    findDoc: function (docs, id, key) {
      if (!key) {
        key = '_id';
      }
      var doc = null;
      for(var i in docs) {
        if (docs[i][key] == id) {
          doc = docs[i];
          break;
        }
      }
      return { i: i, doc: doc };
    },
    onDeleteItem: function(id) {
      var match = this.findDoc(this.shoppingListItems, id);
      db.remove(match.doc).then((data) => {
        this.shoppingListItems.splice(match.i, 1);
      });
    }
  }
});