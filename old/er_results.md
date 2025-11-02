`er_diagram['type']`: 1

access:
`er_diagram['data']['nodes']`

drop (for each node, and for the data of each node):

`irrelevant_features = ['position', 'isSelected', 'isConnectable', 'selected', 'dragging', 'measured']`

types of nodes:

Label:
``` javascript
{
    'id': ...,
    'type': 'Label',
    'data': {'label': ...}
}
```

Entity:
```javascript
{
    'id': ...,
    'type': 'Entity',
    'data': 
        {
         'label': ...,
         'type': OneFrom([
                'Regular', 
                'Weak', 
                'Associative', 
                'Supertype'
                ]),
         Optional('parentId'): ...,   
        }
}
```

Attribute:
```javascript
{
    'id': ...,
    Optional('parentId'): ...,
    'type': 'Attribute',
    'data': 
        {
         'label': ...,
         'types': ZeroOrAtLeastOneFrom([
            { 'Unique': True },
            { 'Multivalued': True },
            { 'Optional': True },
            { 'Composite': True },
            { 'Derived': True }
            ])
        }
}
```

Relationship:
```javascript
{
    'id': ...,
    'type': 'Relationship',
    'data': 
        {
         'label': ...,
         Optional('isIdentifying'): True,
         Optional('isSelfReferencing'): True,
         'sourceEntityDetails': 
            {
                'id': ...,
                Optional('exactConstraints'): 
                    {
                        'role': ...,
                        Optional('min'): Number,
                        Optional('max'): Number
                    }
                Optional('minCardinality'): OneFrom([
                        'Mandatory', 
                        'Optional'
                        ]),
                Optional('maxCardinality'): OneFrom([
                        'One', 
                        'Many'
                        ]),
            },
        'targetEntityDetails': 
            {
                'id': ...,
                Optional('exactConstraints'): 
                    {
                        'role': ...,
                        Optional('min'): Number,
                        Optional('max'): Number
                    }
                Optional('minCardinality'): OneFrom([
                        'Mandatory', 
                        'Optional'
                        ]),
                Optional('maxCardinality'): OneFrom([
                        'One', 
                        'Many'
                        ]),
            },

        }
}
```

Positions and etc are also necessary.
irrelevant_features = ['position', 'isSelected', 'isConnectable', 'selected', 'dragging', 'measured']