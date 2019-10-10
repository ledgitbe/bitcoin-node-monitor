import React, { Component } from 'react';
import Layout from './Layout';
import { Provider } from 'react-redux';
import BlockchainNodes from './BlockchainNodes';
import Footer from './Footer';
import store from './store';

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Layout content={<BlockchainNodes/>} footer={<Footer />}/>
      </Provider>
    );
  }
}

export default App;
