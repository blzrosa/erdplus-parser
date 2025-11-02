`relational_diagram['type']`: 2

access:
`relational_diagram['data']['nodes']`

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

Table
```javascript
{
    'id': ...,
    'type': 'Table',
    'data':
        {
            'label': ...,
            Optional('isFactTable'): True,
            'columns': 
            [
                ZeroOrAtLeastOne({
                    'id': ...,
                    'name': ...,
                    'position': 0,
                    'type': OneFrom([
                            'INT',
                            'None',
                            'Custom',
                            'CHAR(n)',
                            'DATE',
                            'FLOAT',
                            'NUMERIC(p s)',
                            'VARCHAR(n)'
                        ]),
                    Optional('size'): String,
                    Optional('isPrimaryKey'): True,
                    Optional('isOptional'): False,
                    Optional('isUnique'): True,

                    Optional('isForeignKey'): True,
                    Optional('foreignKeyProps'):
                        {
                            'foreignKeyGroupId': ...,
                            'sourceTableId': ...,
                            'columns': AtLeastOne([
                                {
                                    'id': ...,
                                    'name': ...,
                                    'type': OneFrom([
                                            'INT',
                                            'None',
                                            'Custom',
                                            'CHAR(n)',
                                            'DATE',
                                            'FLOAT',
                                            'NUMERIC(p s)',
                                            'VARCHAR(n)'
                                        ])
                                }
                                ])
                        }
                })
            ]
        }
}
```