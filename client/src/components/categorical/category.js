import React from "react";
import _ from "lodash";
import { connect } from "react-redux";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import {
  Button,
  Tooltip,
  InputGroup,
  Menu,
  Dialog,
  MenuItem,
  Popover,
  Classes,
  Icon,
  Position,
  PopoverInteractionKind,
  ButtonGroup
} from "@blueprintjs/core";

import * as globals from "../../globals";
import Value from "./value";
import sortedCategoryValues from "./util";

@connect(state => ({
  colorAccessor: state.colors.colorAccessor,
  categoricalSelection: state.categoricalSelection,
  annotations: state.annotations,
  universe: state.universe,
  labeledCategory: state.centroidLabel.labeledCategory,
  graphInteractionMode: state.controls.graphInteractionMode
}))
class Category extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: true,
      isExpanded: false,
      newCategoryText: "",
      newLabelText: ""
    };
  }

  componentDidUpdate(prevProps) {
    const { categoricalSelection, metadataField } = this.props;
    if (categoricalSelection !== prevProps.categoricalSelection) {
      const cat = categoricalSelection[metadataField];
      const categoryCount = {
        // total number of categories in this dimension
        totalCatCount: cat.numCategoryValues,
        // number of selected options in this category
        selectedCatCount: _.reduce(
          cat.categoryValueSelected,
          (res, cond) => (cond ? res + 1 : res),
          0
        )
      };
      if (categoryCount.selectedCatCount === categoryCount.totalCatCount) {
        /* everything is on, so not indeterminate */
        this.checkbox.indeterminate = false;
        this.setState({ isChecked: true }); // eslint-disable-line react/no-did-update-set-state
      } else if (categoryCount.selectedCatCount === 0) {
        /* nothing is on, so no */
        this.checkbox.indeterminate = false;
        this.setState({ isChecked: false }); // eslint-disable-line react/no-did-update-set-state
      } else if (categoryCount.selectedCatCount < categoryCount.totalCatCount) {
        /* to be explicit... */
        this.checkbox.indeterminate = true;
        this.setState({ isChecked: false });
      }
    }
  }

  activateAddNewLabelMode = () => {
    const { dispatch, metadataField } = this.props;
    dispatch({
      type: "annotation: activate add new label mode",
      data: metadataField
    });
  };

  disableAddNewLabelMode = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "annotation: disable add new label mode"
    });
  };

  handleAddNewLabelToCategory = () => {
    const { dispatch, metadataField } = this.props;
    const { newLabelText } = this.state;
    /*
    XXX TODO - temporary code generates random label string.   Remove
    when the label creation UI is implemented.

    const { newLabelText } = this.state;
    */
    // const newLabelText = `label${Math.random()}`;
    dispatch({
      type: "annotation: add new label to category",
      metadataField,
      newLabelText
    });
    this.setState({ newLabelText: "" });
  };

  activateEditCategoryMode = () => {
    const { dispatch, metadataField } = this.props;
    dispatch({
      type: "annotation: activate category edit mode",
      data: metadataField
    });
  };

  disableEditCategoryMode = () => {
    const { dispatch } = this.props;
    dispatch({
      type: "annotation: disable category edit mode"
    });
  };

  handleEditCategory = () => {
    const { dispatch, metadataField } = this.props;
    const { newCategoryText } = this.state;

    dispatch({
      type: "annotation: category edited",
      metadataField,
      newCategoryText,
      data: newCategoryText
    });
  };

  handleDeleteCategory = () => {
    const { dispatch, metadataField } = this.props;
    dispatch({
      type: "annotation: delete category",
      metadataField
    });
  };

  handleColorChange = () => {
    const { dispatch, metadataField } = this.props;
    dispatch({
      type: "color by categorical metadata",
      colorAccessor: metadataField
    });
  };

  handleCentroidChange = () => {
    const { dispatch, metadataField } = this.props;
    dispatch({
      type: "show centroid labels for category",
      metadataField
    });
  };

  toggleAll() {
    const { dispatch, metadataField } = this.props;
    dispatch({
      type: "categorical metadata filter all of these",
      metadataField
    });
    this.setState({ isChecked: true });
  }

  toggleNone() {
    const { dispatch, metadataField } = this.props;
    dispatch({
      type: "categorical metadata filter none of these",
      metadataField
    });
    this.setState({ isChecked: false });
  }

  handleToggleAllClick() {
    const { isChecked } = this.state;
    // || this.checkbox.indeterminate === false
    if (isChecked) {
      this.toggleNone();
    } else if (!isChecked) {
      this.toggleAll();
    }
  }

  renderCategoryItems() {
    const { categoricalSelection, metadataField, isUserAnno } = this.props;

    const cat = categoricalSelection[metadataField];
    const optTuples = sortedCategoryValues([...cat.categoryValueIndices]);
    return _.map(optTuples, (tuple, i) => (
      <Value
        isUserAnno={isUserAnno}
        optTuples={optTuples}
        key={tuple[1]}
        metadataField={metadataField}
        categoryIndex={tuple[1]}
        i={i}
      />
    ));
  }

  render() {
    const { isExpanded, isChecked, newLabelText, newCategoryText } = this.state;
    const {
      metadataField,
      colorAccessor,
      categoricalSelection,
      isUserAnno,
      annotations,
      universe,
      labeledCategory,
      graphInteractionMode
    } = this.props;
    const { isTruncated } = categoricalSelection[metadataField];

    return (
      <div
        style={{
          maxWidth: globals.maxControlsWidth
        }}
        data-testclass="category"
        data-testid={`category-${metadataField}`}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "baseline"
            }}
          >
            <label className="bp3-control bp3-checkbox">
              <input
                data-testclass="category-select"
                data-testid={`category-select-${metadataField}`}
                onChange={this.handleToggleAllClick.bind(this)}
                ref={el => {
                  this.checkbox = el;
                  return el;
                }}
                checked={isChecked}
                type="checkbox"
              />
              <span className="bp3-control-indicator" />
              {""}
            </label>
            {/* Dialog uses portal, can be anywhere/factored out */}
            <Dialog
              icon="tag"
              title="Edit category name"
              isOpen={
                annotations.isEditingCategoryName &&
                annotations.categoryEditable === metadataField
              }
              onClose={this.disableEditCategoryMode}
            >
              <div className={Classes.DIALOG_BODY}>
                <div style={{ marginBottom: 20 }}>
                  <p>New, unique category name:</p>
                  <InputGroup
                    autoFocus
                    onChange={e =>
                      this.setState({ newCategoryText: e.target.value })
                    }
                    leftIcon="tag"
                  />
                </div>
              </div>
              <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                  <Tooltip content="Close this dialog without editing the category.">
                    <Button onClick={this.disableEditCategoryMode}>
                      Cancel
                    </Button>
                  </Tooltip>
                  <Button
                    disabled={newCategoryText.length === 0}
                    onClick={this.handleEditCategory}
                    intent="primary"
                  >
                    Edit category name
                  </Button>
                </div>
              </div>
            </Dialog>
            <span
              data-testid={`category-expand-${metadataField}`}
              style={{
                cursor: "pointer",
                display: "inline-block"
              }}
              onClick={() => {
                this.setState({ isExpanded: !isExpanded });
              }}
            >
              {isUserAnno ? (
                <Icon style={{ marginRight: 5 }} icon="tag" iconSize={16} />
              ) : null}
              {metadataField}
              {isExpanded ? (
                <FaChevronDown
                  data-testclass="category-expand-is-expanded"
                  style={{ fontSize: 10, marginLeft: 5 }}
                />
              ) : (
                <FaChevronRight
                  data-testclass="category-expand-is-not-expanded"
                  style={{ fontSize: 10, marginLeft: 5 }}
                />
              )}
            </span>
          </div>
          <div>
            {isUserAnno ? (
              <>
                <Dialog
                  icon="tag"
                  title="Add new label"
                  isOpen={annotations.isAddingNewLabel}
                  onClose={this.disableAddNewLabelMode}
                >
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      this.handleAddNewLabelToCategory();
                    }}
                  >
                    <div className={Classes.DIALOG_BODY}>
                      <div style={{ marginBottom: 20 }}>
                        <p>New, unique label name:</p>
                        <InputGroup
                          autoFocus
                          onChange={e =>
                            this.setState({ newLabelText: e.target.value })
                          }
                          leftIcon="tag"
                        />
                      </div>
                    </div>
                    <div className={Classes.DIALOG_FOOTER}>
                      <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Tooltip content="Close this dialog without adding a label.">
                          <Button onClick={this.disableAddNewLabelMode}>
                            Cancel
                          </Button>
                        </Tooltip>
                        <Button
                          disabled={
                            newLabelText.length === 0 ||
                            universe.schema.annotations.obsByName[
                              metadataField
                            ].categories.indexOf(newLabelText) !== -1
                          }
                          onClick={this.handleAddNewLabelToCategory}
                          intent="primary"
                          type="submit"
                        >
                          Add new label to category
                        </Button>
                      </div>
                    </div>
                  </form>
                </Dialog>
                <Popover
                  interactionKind={PopoverInteractionKind.HOVER}
                  boundary="window"
                  position={Position.RIGHT_TOP}
                  content={
                    <Menu>
                      <MenuItem
                        icon="tag"
                        data-testclass="handleAddNewLabelToCategory"
                        data-testid={`handleAddNewLabelToCategory-${metadataField}`}
                        onClick={this.activateAddNewLabelMode}
                        text="Add a new label to this category"
                      />
                      <MenuItem
                        icon="edit"
                        data-testclass="activateEditCategoryMode"
                        data-testid={`activateEditCategoryMode-${metadataField}`}
                        onClick={this.activateEditCategoryMode}
                        text="Edit this category's name"
                      />
                      <MenuItem
                        icon="delete"
                        intent="danger"
                        data-testclass="handleDeleteCategory"
                        data-testid={`handleDeleteCategory-${metadataField}`}
                        onClick={this.handleDeleteCategory}
                        text="Delete this category, all associated labels, and remove all cell assignments"
                      />
                    </Menu>
                  }
                >
                  <Button
                    style={{ marginLeft: 0 }}
                    data-testclass="seeActions"
                    data-testid={`seeActions-${metadataField}`}
                    icon="more"
                    minimal
                  />
                </Popover>
              </>
            ) : null}
          <ButtonGroup>
            <Tooltip
              content="View the centroids for all values"
              position="bottom"
              disabled={graphInteractionMode === "zoom"}
            >
              <Button
                icon="numbered-list"
                onClick={this.handleCentroidChange}
                active={labeledCategory === metadataField}
                intent={labeledCategory === metadataField ? "primary" : "none"}
                disabled={graphInteractionMode === "zoom"}
              />
            </Tooltip>
            <Tooltip content="Use as color scale" position="bottom">
              <Button
                data-testclass="colorby"
                data-testid={`colorby-${metadataField}`}
                onClick={this.handleColorChange}
                active={colorAccessor === metadataField}
                intent={colorAccessor === metadataField ? "primary" : "none"}
                icon="tint"
              />
            </Tooltip>
          </ButtonGroup>
          </div>
        </div>
        <div style={{ marginLeft: 26 }}>
          {isExpanded ? this.renderCategoryItems() : null}
        </div>
        <div>
          {isExpanded && isTruncated ? (
            <p style={{ paddingLeft: 15 }}>... truncated list ...</p>
          ) : null}
        </div>
      </div>
    );
  }
}

export default Category;
