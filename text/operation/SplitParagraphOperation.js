define(['text/operation/SplitElementOperation'], function(SplitElementOperation){
    return SplitElementOperation.inherit('text.operation.SplitParagraphOperation', {

        ctor: function(textRange){
            this.callBase(textRange, textRange.$.textFlow);
        },

        doOperation: function(){
            this.callBase();
            if(this.$newElement){
                var paragraphParent = this.$previousParagraph.$parent;
                if (paragraphParent) {
                    var paragraphIndex = paragraphParent.getChildIndex(this.$previousParagraph);
                    paragraphParent.addChild(this.$newElement, {index: paragraphIndex + 1});
                }
            }
        }


    });

});