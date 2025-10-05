import * as React from "react";
import { Field, FieldArray, FieldProps } from "formik";
import { Button } from "../../Components/Button";
import { Toggle } from "./Toggle";

export const StatBlockCustomFields = () => {
  return (
    <FieldArray name="StatBlock.CustomFields">
      {arrayHelpers => (
        <div className="custom-statblock-fields">
          <h4>Custom Statblock Fields</h4>
          {arrayHelpers.form.values.StatBlock.CustomFields.map(
            (field, index) => (
              <div key={index} className="custom-field">
                <div className="c-input-with-label">
                  Field Name
                  <Field name={`StatBlock.CustomFields.${index}.name`} />
                </div>
                <div className="c-input-with-label">
                  Display in Combatant Row
                  <Toggle
                    fieldName={`StatBlock.CustomFields.${index}.showInCombatantRow`}
                  />
                </div>
                <div className="c-input-with-label">
                  Combatant Row Header
                  <Field
                    name={`StatBlock.CustomFields.${index}.combatantRowHeader`}
                  />
                </div>
                <div className="c-input-with-label">
                  Combatant Row Width
                  <Field
                    name={`StatBlock.CustomFields.${index}.combatantRowWidth`}
                    type="number"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => arrayHelpers.remove(index)}
                  text="Remove"
                />
              </div>
            )
          )}
          <Button
            type="button"
            onClick={() =>
              arrayHelpers.push({
                name: "",
                type: "string",
                defaultValue: "",
                showInCombatantRow: false,
                combatantRowHeader: "",
                combatantRowWidth: 20
              })
            }
            text="Add Custom Field"
          />
        </div>
      )}
    </FieldArray>
  );
};
