/**
 * React Coverflow
 *
 * Author: andyyou
 */
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Radium from 'radium';
import styles from './stylesheets/coverflow';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

var TOUCH = {move: false,
  lastX: 0,
  sign: 0,
  lastMove: 0
};
var TRANSITIONS = [
  'transitionend',
  'oTransitionEnd',
  'otransitionend',
  'MSTransitionEnd',
  'webkitTransitionEnd'
];
var HandleAnimationState = function() {
  this._removePointerEvents();
};

@Radium
class Coverflow extends Component {
  /**
   * Life cycle events
   */
  constructor(props) {
    super(props);

    this.state = {
      current: this._center(),
      move: 0,
      width: this.props.width || 'auto',
      height: this.props.height || 'auto'
    };
  }

  componentDidMount() {
    this.updateDimensions();
    let length = React.Children.count(this.props.children);

    TRANSITIONS.forEach(event => {
      for (let i = 0; i < length; i++) {
        var figureID = `figure_${i}`;
        this.refs[figureID].addEventListener(event, HandleAnimationState.bind(this));
      }
    });
    window.addEventListener('resize', this.updateDimensions.bind(this));
  }

  componentWillUnmount() {
    let length = React.Children.count(this.props.children);

    TRANSITIONS.forEach(event => {
      for (let i = 0; i < length; i++) {
        var figureID = `figure_${i}`;
        this.refs[figureID].removeEventListener(event, HandleAnimationState.bind(this));
      }
    });
    window.removeEventListener('resize', this.updateDimensions.bind(this));
  }

  updateDimensions() {
    this.setState({
      width: ReactDOM.findDOMNode(this).offsetWidth,
      height: ReactDOM.findDOMNode(this).offsetHeight
    });
  }

  render() {
    const {enableScroll} = this.props;
    const {width, height} = this.state;
    return (
      <div className={styles.container}
           style={[{width: `${width}px`, height: `${height}px`}, this.props.media]}
           onWheel={enableScroll ? this._handleWheel.bind(this) : null}
           onTouchStart={this._handleTouchStart.bind(this)}
           onTouchMove={this._handleTouchMove.bind(this)}
           >
        <div className={styles.coverflow}>
          <div className={styles.preloader}></div>
          <div className={styles.stage} ref="stage">
              {this._renderFigureNodes()}
          </div>
          {
            this.props.navigation &&
            (
              <div className={styles.actions}>
                <button type="button" className={styles.button} onClick={ this._handlePrevFigure.bind(this) }>Previous</button>
                <button type="button" className={styles.button} onClick={ this._handleNextFigure.bind(this) }>Next</button>
              </div>
            )
          }
        </div>
      </div>
    );
  }

  /**
   * Private methods
   */
  _center() {
    let length = React.Children.count(this.props.children);
    return Math.floor(length / 2);
  }

  _handleFigureStyle(index, current) {
    const {displayQuantityOfSide} = this.props;
    const {width} = this.state;
    let style = {};
    let center = this._center();
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let length = React.Children.count(this.props.children);
    let offset = length % 2 === 0 ? -width/10 : 0;
    // Handle opacity
    let depth = displayQuantityOfSide - Math.abs(current - index);
    let opacity = depth === 1 ? 0.95 : 0.5;
    opacity = depth === 2 ? 0.92 : opacity;
    opacity = depth === 3 ? 0.9 : opacity;
    opacity = current === index ? 1 : opacity;
    // Handle translateX
    if (index === current) {
      style['width'] = `${baseWidth}px`;
      style['transform'] = `translateX(${this.state.move + offset}px) scale(1.2)`;
      style['zIndex'] = `${10 - depth}`;
      style['opacity'] = opacity;
    } else if (index < current) {
      // Left side
      style['width'] = `${baseWidth}px`;
      style['transform'] = `translateX(${this.state.move + offset}px) rotateY(40deg)`;
      style['zIndex'] = `${10 - depth}`;
      style['opacity'] = opacity;
    } else if (index > current) {
      // Right side
      style['width'] = `${baseWidth}px`;
      style['transform'] = ` translateX(${this.state.move + offset}px) rotateY(-40deg)`;
      style['zIndex'] = `${10 - depth}`;
      style['opacity'] = opacity;
    }
    return style;
  }

  _handleFigureClick(index, url, e) {

    // Stop here if the user clicks on a current figure with
    // an empty or unset URL.
    if (!url && this.state.current === index) {
      if (console && console.log) {
        console.log ('Figure was clicked but has no URL. Preventing events.');
      }

      return true;
    }

    e.preventDefault();

    this.refs.stage.style['pointerEvents'] = 'none';

    if (this.state.current === index) {
      // TODO: support lightbox.
      window.open(url, '_blank');
      this._removePointerEvents();
    } else {
      const {displayQuantityOfSide} = this.props;
      const {width} = this.state;
      let baseWidth = width / (displayQuantityOfSide * 2 + 1);
      let distance = this._center() - index;
      let move = distance * baseWidth;
      this.setState({current: index, move: move});
    }
  }

  _renderFigureNodes() {
    const {enableHeading} = this.props;

    let figureNodes = React.Children.map(this.props.children, (child, index) => {
      let figureElement = React.cloneElement(child, {className: styles.cover});
      let style = this._handleFigureStyle(index, this.state.current);
      return (
        <figure className={styles.figure}
          key={index}
          style={style}
          onClick={ this._handleFigureClick.bind(this, index, figureElement.props.url) }
          ref={`figure_${index}`}
          >
          {figureElement}
          {
            enableHeading &&
            <div className={styles.text}>{figureElement.props.alt}</div>
          }
        </figure>
      );
    });
    return figureNodes;
  }

  _removePointerEvents() {
    this.refs.stage.style['pointerEvents'] = 'auto';
  }

  _handlePrevFigure() {
    const {displayQuantityOfSide} = this.props;
    const {width} = this.state;
    let current = this.state.current;
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let distance = this._center() - (current - 1);
    let move = distance * baseWidth;

    if (current - 1 >= 0) {
      this.setState({ current: current - 1, move: move });
      TOUCH.lastMove = move;
    }
  }

  _handleNextFigure() {
    const {displayQuantityOfSide} = this.props;
    const {width} = this.state;
    let current = this.state.current;
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let distance = this._center() - (current + 1);
    let move = distance * baseWidth;

    if (current + 1 < this.props.children.length) {
      this.setState({ current: current + 1, move: move });
      TOUCH.lastMove = move;
    }
  }

  _handleWheel(e) {
    e.preventDefault();

    let delta = e.deltaY * (-120);
    let count = Math.ceil(Math.abs(delta) / 120);

    if (count > 0) {
      const sign = Math.abs(delta) / delta;
      let func = null;

      if (sign > 0) {
        func = this._handlePrevFigure.bind(this);
      } else if (sign < 0) {
        func = this._handleNextFigure.bind(this);
      }

      if (typeof func === 'function') {
        for (let i = 0; i < count; i++) func();
      }
    }
  }

  _handleTouchStart(e) {
    TOUCH.lastX = e.nativeEvent.touches[0].clientX;
    TOUCH.lastMove = this.state.move;
  }

  _handleTouchMove(e) {
    e.preventDefault();
    const {displayQuantityOfSide} = this.props;
    const {width} = this.state;

    let clientX = e.nativeEvent.touches[0].clientX;
    let lastX = TOUCH.lastX;
    let baseWidth = width / (displayQuantityOfSide * 2 + 1);
    let move = clientX - lastX;
    let totalMove = TOUCH.lastMove - move;
    let sign = Math.abs(move) / move;

    if (Math.abs(totalMove) >= baseWidth) {
      let func = null;
      if (sign > 0) {
        func = this._handlePrevFigure.bind(this);
      } else if (sign < 0) {
        func = this._handleNextFigure.bind(this);
      }
      if (typeof func === 'function') {
        func();
      }
    }
  }
};

Coverflow.propTypes = {
  displayQuantityOfSide: React.PropTypes.number.isRequired,
  navigation: React.PropTypes.bool,
  enableHeading: React.PropTypes.bool,
  enableScroll: React.PropTypes.bool
};

Coverflow.defaultProps = {
  navigation: false,
  enableHeading: true,
  enableScroll: true
};

Coverflow.displayName = 'Coverflow';

export default Coverflow;
