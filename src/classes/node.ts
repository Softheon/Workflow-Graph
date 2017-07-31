/**
 * The Node
 */
export class Node {
    /** The node ID **/
    public id: number;

    /** The display name of the node **/
    public name: string;

    /** The total number of tasks for the node **/
    public all: number;

    /** The number of completed tasks for the node **/
    public completed: number;

    /** The number of remaining (incomplete) tasks for the node **/
    public remaining: number;

    /** The URL that clicking on the node links to (optional) **/
    public url?: string;

    /** The x-coordinate of the node **/
    public x?: number;

    /** The y-coordinate of the node **/
    public y?: number;
}

