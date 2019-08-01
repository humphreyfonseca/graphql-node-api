import { makeExecutableSchema } from 'graphql-tools';

const users: any[] = [
    {
        id: 1,
        name: 'Jon',
        email: 'jon@email.com'
    },
    {
        id: 2,
        name: 'Dany',
        email: 'dany@email.com'
    }
];


const typeDefs = `
    type User{
        id: ID!
        name: String!
        email: String!
        photo: String
        post:[Post!]!
    }

    type Post{
        id: ID!
        title: String!
        content: String!
        photo: String!
        author: User!
        comments: [Comment!]!
    }

    type Comment{
        id: ID!
        comment: String!
        user: User!
        post: Post!
    }

    type Query{
        allUsers: [User!]!
    }

    type Mutation {
        createUser(name: String!, email: String!): User
    }
`;

const resolvers = {
    //resolver trival exemplo
    //nao necessario nesse caso
    User:{
        id:   (user) => user.id,
        name: (user) => user.name,
        email:(user) => user.email
    },
    Query:{
        allUsers: () => users
    },
    Mutation:{
        createUser: (parent, args) => {
            const newUser = Object.assign({id: users.length+1}, args);
            users.push(newUser);
            return newUser;
        }
    }
};

export default makeExecutableSchema({typeDefs, resolvers});