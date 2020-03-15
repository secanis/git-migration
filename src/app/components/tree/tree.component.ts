import { Component, Input } from '@angular/core';
import { TreeNode } from 'src/app/shared/interfaces/tree-node';

@Component({
    selector: 'app-tree',
    templateUrl: './tree.component.html',
    styleUrls: ['./tree.component.css']
})
export class TreeComponent {
    @Input() dataSource;
    @Input() treeControl;

    hasChild = (_: number, node: TreeNode) =>
        !!node.children && node.children.length > 0;
}
