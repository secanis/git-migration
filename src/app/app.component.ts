import { Component } from '@angular/core';
import * as git from 'isomorphic-git/index.umd.min';
import * as http from 'isomorphic-git/http/web';
import * as LightningFS from '@isomorphic-git/lightning-fs';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { TreeNode } from './shared/interfaces/tree-node';
import { Repositories } from './shared/interfaces/repositories';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'git-migrator';
    readonly dir = '/source';
    readonly corsProxy = 'https://cors.isomorphic-git.org';
    repos: Repositories = {
        source: {
            url: '',
            remote: 'origin',
            ref: 'master',
            remoteRef: 'master'
        },
        target: {
            url: '',
            remote: 'origin',
            ref: 'master',
            remoteRef: 'master'
        }
    };

    private fs = new LightningFS('fs');

    treeControl = new NestedTreeControl<TreeNode>(node => node.children);
    data = {
        files: new MatTreeNestedDataSource<TreeNode>(),
        tags: [],
        branches: [],
        remotes: []
    };

    constructor() {
        this.fetchAll();
    }

    clone(config) {
        this.data.files.data = [];
        this.setupFS();
        git.clone({
            fs: this.fs,
            http,
            dir: this.dir,
            url: config.source.url,
            corsProxy: this.corsProxy,
            onAuth: () => ({
                username: config.source.username,
                password: config.source.password
            })
        }).then(i => {
            this.fetchAll();
        });
    }

    fetchAll() {
        this.getFiles();
        this.getTags();
        this.getBranches();
        this.getRemotes();
    }

    async getFiles() {
        this.data.files.data = null;
        const files = await git
            .listFiles({
                fs: this.fs,
                dir: this.dir,
                ref: 'HEAD'
            })
            .catch(e => {
                console.warn(
                    'no existing repository, try to clone first:',
                    e.message
                );
            });
        if (files) {
            const unformatedTree: TreeNode[] = [];
            files.forEach(file => {
                unformatedTree.push(this.buildFileTree(file));
            });
            this.data.files.data = this.reduceDuplicates(unformatedTree);
        }
    }

    async getTags() {
        this.data.tags = await git.listTags({ fs: this.fs, dir: this.dir });
    }

    async getBranches() {
        this.data.branches = await git.listBranches({
            fs: this.fs,
            dir: this.dir,
            remote: this.repos.source.remote || 'origin'
        });
    }

    async getRemotes() {
        this.data.remotes = await git.listRemotes({
            fs: this.fs,
            dir: this.dir
        });
    }

    async pushRemote(config) {
        const result = await git.push({
            fs: this.fs,
            http,
            dir: this.dir,
            url: config.target.url,
            ref: this.repos.source.ref || 'master',
            remoteRef: this.repos.source.remoteRef || 'master',
            remote: this.repos.source.remote || 'origin',
            corsProxy: this.corsProxy,
            onAuth: () => ({
                username: config.target.username,
                password: config.target.password
            })
        });
    }

    async addRemote(config) {
        await git.deleteRemote({
            fs: this.fs,
            dir: this.dir,
            remote: this.repos.source.remote || 'origin'
        });
        await git.addRemote({
            fs: this.fs,
            dir: this.dir,
            remote: this.repos.source.remote || 'origin',
            force: true,
            url: config.target.url
        });
        this.getRemotes();
    }

    private setupFS() {
        this.fs = new LightningFS('fs', { wipe: true });
    }

    private buildFileTree(path: string): TreeNode {
        const segments = path.split('/');
        const treeNode: TreeNode = {
            name: segments.shift(),
            children: []
        };
        if (segments.length > 0) {
            treeNode.children.push(this.buildFileTree(segments.join('/')));
        }
        return treeNode;
    }

    private reduceDuplicates(array: TreeNode[]): TreeNode[] {
        const output: TreeNode[] = [];
        array.forEach(item => {
            const existing = output.filter((v, i) => {
                return v.name === item.name;
            });
            if (existing.length) {
                const existingIndex = output.indexOf(existing[0]);
                output[existingIndex].children = output[
                    existingIndex
                ].children.concat(item.children);
                output[existingIndex].children = this.reduceDuplicates(
                    output[existingIndex].children
                );
            } else {
                output.push(item);
            }
        });
        return output;
    }
}
