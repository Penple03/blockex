
import Actions from '../core/Actions';
import Component from '../core/Component';
import { connect } from 'react-redux';
import { dateFormat } from '../../lib/date';
import { Link } from 'react-router-dom';
import moment from 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import sortBy from 'lodash/sortBy';

import HorizontalRule from '../component/HorizontalRule';
import Pagination from '../component/Pagination';
import Table from '../component/Table';

class Masternode extends Component {
  static propTypes = {
    getMNs: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.debounce = null;
    this.state = {
      cols: [
        { key: 'lastPaidAt', title: 'Last Paid' },
        { key: 'active', title: 'Active Duration' },
        { key: 'addr', title: 'Transaction' },
        { key: 'txOutIdx', title: 'Index' },
        { key: 'ver', title: 'Version' },
        { key: 'status', title: 'Status' },
      ],
      mns: [] ,
      pages: 0,
      page: 1,
      size: 10
    };
  };

  componentDidMount() {
    this.getMNs();
  };

  componentWillUnmount() {
    if (this.debounce) {
      clearTimeout(this.debounce);
      this.debounce = null;
    }
  };

  getMNs = () => {
    if (this.debounce) {
      clearTimeout(this.debounce);
    }

    this.debounce = setTimeout(() => {
      this.props
        .getMNs({
          limit: this.state.size,
          skip: (this.state.page - 1) * this.state.size
        })
        .then(({ mns, pages }) => {
          if (this.debounce) {
            this.setState({ mns, pages });
          }
        });
    }, 800);
  };

  handlePage = page => this.setState({ page }, this.getMNs);

  handleSize = size => this.setState({ size, page: 1 }, this.getMNs);

  render() {
    const select = (
      <select
        onChange={ ev => this.handleSize(ev.target.value) }
        value={ this.state.size }>
        <option value={ 10 }>10</option>
        <option value={ 25 }>25</option>
        <option value={ 50 }>50</option>
      </select>
    );

    // Calculate the future so we can use it to
    // sort by lastPaid in descending order.
    const future = moment().add(2, 'years').utc().unix();

    return (
      <div>
        <HorizontalRule
          select={ select }
          title="Masternodes" />
        <Table
          cols={ this.state.cols }
          data={ sortBy(this.state.mns.map((mn) => {
            const lastPaidAt = moment(mn.lastPaidAt).utc();
            const isEpoch = lastPaidAt.unix() === 0;

            return {
              ...mn,
              active: moment().subtract(mn.active, 'seconds').utc().fromNow(),
              addr: (
                <Link to={ `/tx/${ mn.txHash }` }>{ mn.txHash }</Link>
              ),
              lastPaidAt: isEpoch ? 'N/A' : dateFormat(mn.lastPaidAt),
              txHash: (
                <Link to={ `/tx/${ mn.txHash }` }>{ mn.txHash }</Link>
              )
            };
          }), ['status']) } />
        <Pagination
          current={ this.state.page }
          className="float-right"
          onPage={ this.handlePage }
          total={ this.state.pages } />
        <div className="clearfix" />
      </div>
    );
  };
}

const mapDispatch = dispatch => ({
  getMNs: query => Actions.getMNs(query)
});

export default connect(null, mapDispatch)(Masternode);
