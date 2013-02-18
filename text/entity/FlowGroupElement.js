define(['text/entity/FlowElement', 'js/core/List', 'underscore'], function (FlowElement, List, _) {

    var undefined;

    return FlowElement.inherit('text.entity.FlowGroupElement', {
        schema: {
            children: [FlowElement]
        },
        defaults: {
            children: List
        },
        addChild: function (child, options) {
            if (!(child instanceof FlowElement)) {
                throw new Error("Child not instanceof FlowElement");
            }

            child.$parent = this;

            this.$.children.add(child, options);
        },

        findChildIndexAtPosition: function (textPosition) {
            var textLength = 0, childLength, ret = -1;
            this.$.children.each(function (child, index) {
                childLength = child.textLength();
                if (textLength + childLength > textPosition) {
                    ret = index;
                    this["break"]();
                }
                textLength += childLength;
            });

            if (textPosition >= textLength) {
                return this.$.children.size() - 1;
            }

            return ret;
        },

        findLeaf: function (textPosition) {
            var index = this.findChildIndexAtPosition(textPosition);

            if (index > -1) {
                var child = this.$.children.at(index);
                if (!child.isLeaf) {
                    var textLength = 0;
                    for (var i = 0; i < index; i++) {
                        textLength += this.$.children.at(i).textLength();
                    }
                    textPosition = textPosition - textLength;

                    return child.findLeaf(textPosition);
                } else {
                    return child;
                }
            }

            return null;
        },

        getChildAt: function (index) {
            return this.$.children.at(index);
        },

        getChildIndex: function (child) {
            return this.$.children.indexOf(child);
        },

        getFirstLeaf: function () {
            var length = this.$.children.size(),
                child;

            for (var i = 0; i < length; i++) {
                child = this.$.children.at(i);
                if (child.isLeaf) {
                    return child;
                } else {
                    return child.getFirstLeaf();
                }
            }

            return null;
        },

        getLastLeaf: function () {
            var length = this.$.children.size(),
                child;

            for (var i = length - 1; i >= 0; i--) {
                child = this.$.children.at(i);
                if (child.isLeaf) {
                    return child;
                } else {
                    return child.getLastLeaf();
                }
            }

            return null;
        },

        text: function (relativeStart, relativeEnd, paragraphSeparator) {
            if (relativeStart === undefined) {
                relativeStart = 0;
            }
            if (relativeEnd === undefined) {
                relativeEnd = -1;
            }
            if (paragraphSeparator === undefined) {
                paragraphSeparator = " ";
            }

            var text = "", textLength = 0, childLength, readText = false, startIndex;
            this.$.children.each(function (child) {
                childLength = child.textLength();
                if (!readText && textLength + childLength >= relativeStart) {
                    readText = true;
                    startIndex = relativeStart > textLength ? relativeStart - textLength : relativeStart;
                }

                textLength += childLength;

                if (readText) {
                    if (child.isLeaf) {
                        text += child.text(0, -1, paragraphSeparator);
                    } else {
                        text += child.text(0, -1, paragraphSeparator) + paragraphSeparator;
                    }
                }

                if (relativeEnd !== -1 && textLength > relativeEnd) {
                    text = text.substring(startIndex, startIndex + relativeEnd - relativeStart);
                    this["break"]();
                }
            });

            return text;
        },

        textLength: function () {
            var textLength = 0;
            this.$.children.each(function (child) {
                textLength += child.textLength();
            });
            return textLength;
        },

        removeChild: function (child, options) {
            this.$.children.remove(child, options);
        },

        removeChildAt: function (index, options) {
            this.$.children.removeAt(index, options);
        },
        /***
         * Replaces child elements in the group with the specified new elements.
         * @param {Number} beginChildIndex
         * @param {Number} endChildIndex
         * @param [FlowElement] children
         */
        replaceChildren: function (beginChildIndex, endChildIndex, children) {
            var newChildren = Array.prototype.slice.call(arguments, 2);

            var k = 0;
            for (var i = beginChildIndex; i <= endChildIndex; i++) {
                this.removeChildAt(i);
                this.addChild(newChildren[k]);
                k++;
            }
        },
        /***
         * Splits this object at the position specified by the childIndex parameter.
         * @param index
         */
        splitAtIndex: function (index) {
            var length = this.$.children.size(), child, ret = null;
            if (index < length) {
                var attributes = _.clone(this.$);
                attributes.children = new List();
                ret = new this.factory(attributes);

                for (var i = index; i < length; i++) {
                    child = this.$.children.removeAt(i);
                    if (child) {
                        ret.addChild(child);
                    }
                }
            }

            return ret;
        },

        shallowCopy: function (relativeStart, relativeEnd) {
            var copy = this.callBase(relativeStart, relativeEnd),
                textLength = 0,
                size = this.$.children.size(),
                from, to,
                child,
                childLength = 0;

            for (var i = 0; i < size; i++) {
                if (relativeEnd > -1 && textLength > relativeEnd) {
                    break;
                }
                from = 0;
                to = -1;
                child = this.$.children.at(i);
                childLength = child.textLength();
                if(textLength + childLength > relativeStart){
                    if(textLength <= relativeStart && textLength + childLength > relativeStart){
                        from = relativeStart  - textLength;
                    }
                    if(relativeEnd > -1 && textLength + childLength > relativeEnd){
                        to = relativeEnd - textLength;
                    }
                    copy.addChild(child.shallowCopy(from, to));
                }
                textLength += childLength;
            }

            return copy;
        },

        splitAtPosition: function (position) {
            var copy = this.shallowCopy(position),
                child,
                textLength = 0;

            var childIndex = this.findChildIndexAtPosition(position);
            if(childIndex > -1){
                child = this.getChildAt(childIndex);
                for(var i = 0; i < childIndex; i++){
                    textLength += this.getChildAt(i).textLength();
                }
                child.splitAtPosition(position - textLength);

                while(childIndex + 1 < this.$.children.size()){
                    this.$.children.removeAt(childIndex + 1);
                }

            }

            return copy;
        },

        numChildren: function () {
            return this.$.children.size();
        }.on(["children", "*"])

    });

});