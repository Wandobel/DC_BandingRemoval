#feature-id Utilities > DC_BandingRemoval_Simple
#feature-info Suppression simple de banding vertical/horizontal \
par correction colonne/ligne.

function DC_BandingRemovalDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = "DC Banding Removal (simple)";

   // Cases à cocher
   this.verticalCheckBox = new CheckBox( this );
   this.verticalCheckBox.text = "Traiter les bandes verticales";
   this.verticalCheckBox.checked = true;

   this.horizontalCheckBox = new CheckBox( this );
   this.horizontalCheckBox.text = "Traiter les bandes horizontales";
   this.horizontalCheckBox.checked = false;

   // Boutons
   var self = this;

   this.okButton = new PushButton( this );
   this.okButton.text = "OK";
   this.okButton.onClick = function() { self.ok(); };

   this.cancelButton = new PushButton( this );
   this.cancelButton.text = "Annuler";
   this.cancelButton.onClick = function() { self.cancel(); };

   let buttons = new HorizontalSizer;
   buttons.addStretch();
   buttons.add( this.okButton );
   buttons.add( this.cancelButton );

   let s = new VerticalSizer;
   s.margin = 8;
   s.spacing = 6;
   s.add( this.verticalCheckBox );
   s.add( this.horizontalCheckBox );
   s.addSpacing( 8 );
   s.add( buttons );

   this.sizer = s;
   this.adjustToContents();
}

DC_BandingRemovalDialog.prototype = new Dialog;

// --- suppression de banding par médiane de colonnes / lignes ---

function applyBandingRemoval( amount, vertical, horizontal )
{
   var w = ImageWindow.activeWindow;
   if ( w.isNull )
   {
      console.criticalln( "Aucune image active." );
      return;
   }

   var view = w.currentView;
   var img = view.image;
   var W = img.width;
   var H = img.height;
   var C = img.numberOfChannels;

   var step = 4; // on échantillonne 1 ligne/4 pour aller plus vite

   console.writeln( "<end><cbr><b>DC Banding Removal (simple)…</b>" );
   view.beginProcess();

   // ---------- bandes verticales ----------
   if ( vertical )
   {
      console.writeln( "  Traitement des bandes verticales…" );
      for ( var c = 0; c < C; ++c )
      {
         var colMed = new Array( W );
         for ( var x = 0; x < W; ++x )
         {
            var v = [];
            for ( var y = 0; y < H; y += step )
               v.push( img.sample( x, y, c ) );
            v.sort( function(a,b){ return a-b; } );
            colMed[x] = v[ (v.length>>1) ];
         }
         var g = colMed.slice(0).sort( function(a,b){return a-b;} );
         var globalMed = g[ (g.length>>1) ];

         for ( var x = 0; x < W; ++x )
         {
            var delta = (colMed[x] - globalMed) * amount;
            if ( delta == 0 ) continue;
            for ( var y = 0; y < H; ++y )
               img.setSample( img.sample(x,y,c) - delta, x, y, c );
         }
      }
   }

   // ---------- bandes horizontales ----------
   if ( horizontal )
   {
      console.writeln( "  Traitement des bandes horizontales…" );
      for ( var c = 0; c < C; ++c )
      {
         var rowMed = new Array( H );
         for ( var y = 0; y < H; ++y )
         {
            var v = [];
            for ( var x = 0; x < W; x += step )
               v.push( img.sample( x, y, c ) );
            v.sort( function(a,b){ return a-b; } );
            rowMed[y] = v[ (v.length>>1) ];
         }
         var g = rowMed.slice(0).sort( function(a,b){return a-b;} );
         var globalMed = g[ (g.length>>1) ];

         for ( var y = 0; y < H; ++y )
         {
            var delta = (rowMed[y] - globalMed) * amount;
            if ( delta == 0 ) continue;
            for ( var x = 0; x < W; ++x )
               img.setSample( img.sample(x,y,c) - delta, x, y, c );
         }
      }
   }

   view.endProcess();
   console.writeln( "  Terminé." );
}

function main()
{
   var d = new DC_BandingRemovalDialog();
   if ( !d.execute() )
      return;

   // force de correction : 0.6 = assez fort, mais pas destructeur
   var amount = 0.6;

   applyBandingRemoval(
      amount,
      d.verticalCheckBox.checked,
      d.horizontalCheckBox.checked
   );
}

main();
