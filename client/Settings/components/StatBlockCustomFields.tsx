import * as React from "react";
import { Field, FieldArray, FieldProps } from "formik";
import { Button } from "../../Components/Button";

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
                  <Button
                    type="button"
                    onClick={() => arrayHelpers.remove(index)}
                    text="Remove"
                  />
                </div>
              </div>
            )
          )}
          <Button
            type="button"
            onClick={() =>
              arrayHelpers.push({
                name: "",
                type: "string",
                showInCombatantRow: true,
                defaultValue: ""
              })
            }
            text="Add Custom Field"
          />
        </div>
      )}
    </FieldArray>
  );
};
